import path from 'node:path';
import knexFactory, { type Knex } from 'knex';
import { config } from '../config';

export const knexConfig: Knex.Config = {
  client: 'pg',
  connection: config.databaseUrl,
  pool: { min: 0, max: 10 },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    // Geliştirmede .ts, derlenmiş Docker imajında .js dosyaları çalışır.
    loadExtensions: ['.ts', '.js'],
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
    loadExtensions: ['.ts', '.js'],
  },
};

export const db = knexFactory(knexConfig);
