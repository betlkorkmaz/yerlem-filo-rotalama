import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import knexFactory, { type Knex } from 'knex';
import { config } from '../config';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Docker imajında derlenmiş .js, yerel geliştirmede .ts migration dosyaları çalışır.
// Knex çalıştırdığı dosyayı uzantısıyla kaydettiği için aynı veritabanında iki ortam
// birbirinin kaydını "eksik dosya" sanıyordu. Kayıt adı uzantıdan bağımsız olarak hep
// .js tutulur; böylece iki ortam aynı migration geçmişini paylaşır.
const migrationSource: Knex.MigrationSource<string> = {
  async getMigrations() {
    const files = await readdir(MIGRATIONS_DIR);
    return files.filter((f) => /\.(ts|js)$/.test(f) && !f.endsWith('.d.ts')).sort();
  },
  getMigrationName(file) {
    return `${path.parse(file).name}.js`;
  },
  getMigration(file) {
    return import(pathToFileURL(path.join(MIGRATIONS_DIR, file)).href);
  },
};

export const knexConfig: Knex.Config = {
  client: 'pg',
  connection: config.databaseUrl,
  pool: { min: 0, max: 10 },
  migrations: { migrationSource },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
    loadExtensions: ['.ts', '.js'],
  },
};

export const db = knexFactory(knexConfig);
