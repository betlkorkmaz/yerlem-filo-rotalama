import { Router } from 'express';
import { vehicleService } from './vehicle.service';
import {
  createVehicleSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
  vehicleIdParamsSchema,
} from './vehicle.schema';

// Bu katman sadece HTTP'yi bilir: girdiyi doğrular, servisi çağırır, durum koduyla cevaplar.
// Doğrulama hataları (ZodError) Express 5 tarafından otomatik olarak errorHandler'a iletilir.
export const vehicleRouter = Router();

vehicleRouter.get('/', async (req, res) => {
  const query = listVehiclesQuerySchema.parse(req.query);
  res.json(await vehicleService.list(query));
});

vehicleRouter.get('/:id', async (req, res) => {
  const { id } = vehicleIdParamsSchema.parse(req.params);
  res.json(await vehicleService.get(id));
});

vehicleRouter.post('/', async (req, res) => {
  const input = createVehicleSchema.parse(req.body);
  res.status(201).json(await vehicleService.create(input));
});

// Fiziksel silme ucu bilerek yok: araç geçmiş planlarda kullanıldığı için sadece pasif yapılır.
vehicleRouter.patch('/:id', async (req, res) => {
  const { id } = vehicleIdParamsSchema.parse(req.params);
  const input = updateVehicleSchema.parse(req.body);
  res.json(await vehicleService.update(id, input));
});
