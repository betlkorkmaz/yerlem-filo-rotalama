import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { healthRouter } from './modules/health/health.routes';

// Uygulama, sunucuyu dinlemeye başlatmadan oluşturulur; testler bu fonksiyonu
// doğrudan kullanarak gerçek port açmadan istek atabilir.
export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.use('/api/health', healthRouter);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
