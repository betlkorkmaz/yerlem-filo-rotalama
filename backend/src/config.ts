// Ortam değişkenleri tek yerden okunur; varsayılanlar docker-compose ve yerel geliştirme ile uyumludur.
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgres://yerlem:yerlem@localhost:5432/yerlem',
  osrmUrl: process.env.OSRM_URL ?? 'https://router.project-osrm.org',
  osrmTimeoutMs: Number(process.env.OSRM_TIMEOUT_MS ?? 8000),
};
