import { Router } from 'express';
import { routePlanService } from './routePlan.service';
import {
  createRoutePlanSchema,
  listRoutePlansQuerySchema,
  routePlanIdParamsSchema,
  updateRoutePlanSchema,
} from './routePlan.schema';

export const routePlanRouter = Router();

routePlanRouter.get('/', async (req, res) => {
  const { vehicleId } = listRoutePlansQuerySchema.parse(req.query);
  res.json(await routePlanService.list(vehicleId));
});

routePlanRouter.get('/:id', async (req, res) => {
  const { id } = routePlanIdParamsSchema.parse(req.params);
  res.json(await routePlanService.get(id));
});

routePlanRouter.post('/', async (req, res) => {
  const input = createRoutePlanSchema.parse(req.body);
  const { plan, created } = await routePlanService.create(input);
  // Tekrarlanan istekte yeni kayıt açılmadığını 200 ile belirtiriz.
  res.status(created ? 201 : 200).json(plan);
});

// Duraklarla birlikte planın tamamı gönderildiği için PATCH değil PUT.
routePlanRouter.put('/:id', async (req, res) => {
  const { id } = routePlanIdParamsSchema.parse(req.params);
  const input = updateRoutePlanSchema.parse(req.body);
  res.json(await routePlanService.update(id, input));
});
