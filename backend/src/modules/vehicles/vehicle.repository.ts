import type { Knex } from 'knex';
import { db } from '../../db/knex';
import {
  normalizePlate,
  type CreateVehicleInput,
  type ListVehiclesQuery,
  type UpdateVehicleInput,
  type Vehicle,
  type VehicleType,
} from './vehicle.schema';

interface VehicleRow {
  id: string;
  plate: string;
  name: string;
  type: VehicleType;
  capacity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const toVehicle = (row: VehicleRow): Vehicle => ({
  id: row.id,
  plate: row.plate,
  name: row.name,
  type: row.type,
  capacity: row.capacity,
  isActive: row.is_active,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

// Kullanıcının yazdığı % ve _ karakterleri LIKE içinde joker gibi davranmasın.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

export const vehicleRepository = {
  async list({ search, status }: ListVehiclesQuery): Promise<Vehicle[]> {
    const query = db<VehicleRow>('vehicles').select('*').orderBy('created_at', 'desc');

    if (status !== 'all') query.where('is_active', status === 'active');

    if (search) {
      const text = `%${escapeLike(search)}%`;
      // Plaka normalize saklandığı için arama metni de normalize edilir: "34 abc" → "34ABC".
      const plate = `%${escapeLike(normalizePlate(search))}%`;
      query.where((q) => q.whereILike('name', text).orWhereLike('plate', plate));
    }

    return (await query).map(toVehicle);
  },

  async findById(id: string, trx: Knex = db): Promise<Vehicle | undefined> {
    const row = await trx<VehicleRow>('vehicles').where({ id }).first();
    return row && toVehicle(row);
  },

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const [row] = await db<VehicleRow>('vehicles')
      .insert({
        plate: input.plate,
        name: input.name,
        type: input.type,
        capacity: input.capacity,
        is_active: input.isActive,
      })
      .returning('*');
    return toVehicle(row);
  },

  async update(id: string, input: UpdateVehicleInput): Promise<Vehicle | undefined> {
    const [row] = await db<VehicleRow>('vehicles')
      .where({ id })
      .update({
        plate: input.plate,
        name: input.name,
        type: input.type,
        capacity: input.capacity,
        is_active: input.isActive,
        updated_at: db.fn.now() as unknown as Date,
      })
      .returning('*');
    return row && toVehicle(row);
  },
};
