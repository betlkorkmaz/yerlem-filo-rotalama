import knexFactory from 'knex';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    dbAvailable: boolean;
  }
}

// Testlerden önce bir kez çalışır: test veritabanı yoksa oluşturur ve şemayı migration ile kurar.
// PostgreSQL'e ulaşılamazsa (ör. "docker compose up -d db" çalıştırılmamış) entegrasyon testleri
// hata vermek yerine atlanır; veritabanı gerektirmeyen birim testleri yine çalışır.
export default async function setup(project: TestProject) {
  const testUrl = new URL(project.config.env.DATABASE_URL as string);
  const dbName = testUrl.pathname.slice(1);
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = '/postgres';

  const admin = knexFactory({ client: 'pg', connection: adminUrl.toString(), pool: { min: 0, max: 1 } });
  try {
    const { rows } = await admin.raw('select 1 from pg_database where datname = ?', [dbName]);
    if (rows.length === 0) await admin.raw(`create database "${dbName}"`);
  } catch (err) {
    const reason = (err as Error).message || (err as { code?: string }).code || String(err);
    console.warn(`\n⚠️  Test veritabanına ulaşılamadı, entegrasyon testleri atlanacak (${reason}).`);
    console.warn('   Çalıştırmak için önce: docker compose up -d db\n');
    project.provide('dbAvailable', false);
    return;
  } finally {
    await admin.destroy();
  }

  // Şema, uygulamanın kendi migration'larıyla kurulur: testler gerçek şemaya karşı çalışır.
  // İçe aktarma, DATABASE_URL ayarlandıktan sonra yapılmalı; bağlantı adresi import anında okunur.
  process.env.DATABASE_URL = testUrl.toString();
  const { db } = await import('../src/db/knex.js');
  await db.migrate.latest();
  await db.destroy();
  project.provide('dbAvailable', true);
}
