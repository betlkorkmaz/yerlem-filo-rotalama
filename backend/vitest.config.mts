import { defineConfig } from 'vitest/config';

const dbPort = process.env.DB_PORT ?? '5432';

export default defineConfig({
  test: {
    // Entegrasyon testleri geliştirme verisine dokunmasın diye ayrı bir veritabanı kullanılır.
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? `postgres://yerlem:yerlem@localhost:${dbPort}/yerlem_test`,
    },
    globalSetup: ['./tests/globalSetup.ts'],
    // Entegrasyon dosyaları aynı veritabanını kullandığı için sırayla çalışır.
    fileParallelism: false,
  },
});
