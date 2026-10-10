import { Router } from 'express';
import { calculateRouteSchema } from '../route-plans/routePlan.schema';
import { calculateRoute } from './osrm.service';

export const routingRouter = Router();

// Sadece hesaplar, kaydetmez. Rota servisi anahtarı gerekirse tarayıcıya sızmasın ve
// zaman aşımı tek yerden yönetilsin diye istek frontend'den değil backend'den yapılır.
routingRouter.post('/calculate', async (req, res) => {
  const input = calculateRouteSchema.parse(req.body);
  res.json(await calculateRoute(input));
});
