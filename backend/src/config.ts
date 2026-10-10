// Ortam değişkenleri tek yerden okunur; varsayılanlar docker-compose ve yerel geliştirme ile uyumludur.
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgres://yerlem:yerlem@localhost:5432/yerlem',
  osrmUrl: process.env.OSRM_URL ?? 'https://router.project-osrm.org',
  osrmTimeoutMs: Number(process.env.OSRM_TIMEOUT_MS ?? 8000),
  nominatimUrl: process.env.NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org',
  // Nominatim, uygulamayı tanıtan bir User-Agent ister; genel tarayıcı kimliği kabul edilmez.
  nominatimUserAgent:
    process.env.NOMINATIM_USER_AGENT ?? 'yerlem-filo-rotalama/1.0 (+https://github.com/betlkorkmaz/yerlem-filo-rotalama)',
  // Operasyon Türkiye'de varsayılır; adres araması bu ülkeyle sınırlanır.
  geocodingCountryCodes: process.env.GEOCODING_COUNTRY_CODES ?? 'tr',
};
