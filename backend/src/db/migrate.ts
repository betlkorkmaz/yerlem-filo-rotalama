import { db } from './knex';

// Konteyner her açıldığında çalışır: önce şema güncellenir, sonra örnek veri eklenir.
// Böylece değerlendirici ek bir veritabanı komutu çalıştırmak zorunda kalmaz.
async function main() {
  const [batch, migrations] = await db.migrate.latest();
  console.log(`Migration tamam (batch ${batch}, ${migrations.length} yeni dosya)`);

  const [seeds] = await db.seed.run();
  console.log(`Seed tamam (${seeds.length} dosya)`);
}

main()
  .catch((err) => {
    console.error('Veritabanı hazırlığı başarısız:', err);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
