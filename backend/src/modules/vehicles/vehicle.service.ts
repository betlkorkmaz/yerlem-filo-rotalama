import { HttpError } from '../../lib/httpError';
import { isUniqueViolation } from '../../db/pgErrors';
import { vehicleRepository } from './vehicle.repository';
import type { CreateVehicleInput, ListVehiclesQuery, UpdateVehicleInput } from './vehicle.schema';

const plateTaken = () => new HttpError(409, 'PLATE_TAKEN', 'Bu plaka zaten kayıtlı.', { field: 'plate' });
const notFound = () => new HttpError(404, 'VEHICLE_NOT_FOUND', 'Araç bulunamadı.');

export const vehicleService = {
  list(query: ListVehiclesQuery) {
    return vehicleRepository.list(query);
  },

  async get(id: string) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw notFound();
    return vehicle;
  },

  // Plakayı önce "var mı?" diye sorgulamak yerine doğrudan eklemeyi deneriz.
  // Önce-kontrol yaklaşımı aynı anda gelen iki istekte ikisini de geçirebilir;
  // UNIQUE kısıtı ise bunu kesin olarak engeller, biz sadece hatayı 409'a çeviririz.
  async create(input: CreateVehicleInput) {
    try {
      return await vehicleRepository.create(input);
    } catch (err) {
      if (isUniqueViolation(err, 'vehicles_plate_unique')) throw plateTaken();
      throw err;
    }
  },

  async update(id: string, input: UpdateVehicleInput) {
    try {
      const vehicle = await vehicleRepository.update(id, input);
      if (!vehicle) throw notFound();
      return vehicle;
    } catch (err) {
      if (isUniqueViolation(err, 'vehicles_plate_unique')) throw plateTaken();
      throw err;
    }
  },
};
