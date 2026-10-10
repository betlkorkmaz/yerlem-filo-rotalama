import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { healthRouter } from './modules/health/health.routes';
import { vehicleRouter } from './modules/vehicles/vehicle.routes';
import { routePlanRouter } from './modules/route-plans/routePlan.routes';
import { routingRouter } from './modules/routing/routing.routes';
import { geocodingRouter } from './modules/geocoding/geocoding.routes';

// Uygulama, sunucuyu dinlemeye başlatmadan oluşturulur; testler bu fonksiyonu
// doğrudan kullanarak gerçek port açmadan istek atabilir.
export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // API dokümanı: değerlendirici uçları tarayıcıdan inceleyip deneyebilir.
  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'Yerlem API' }));

  app.use('/api/health', healthRouter);
  app.use('/api/vehicles', vehicleRouter);
  app.use('/api/route-plans', routePlanRouter);
  app.use('/api/routing', routingRouter);
  app.use('/api/geocoding', geocodingRouter);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
