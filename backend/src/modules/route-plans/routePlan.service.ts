import type { Knex } from 'knex';
import { db } from '../../db/knex';
import { isUniqueViolation } from '../../db/pgErrors';
import { HttpError } from '../../lib/httpError';
import { routePlanRepository as repo } from './routePlan.repository';
import type { CreateRoutePlanInput, RoutePlanDetail, UpdateRoutePlanInput } from './routePlan.schema';

const notFound = () => new HttpError(404, 'ROUTE_PLAN_NOT_FOUND', 'Rota planı bulunamadı.');

// Pasif araç kuralı burada, kaydın yapıldığı transaction içinde kontrol edilir.
// Ekran açıkken araç başka bir yerde pasif yapılmış olabilir; frontend'deki liste bunu bilemez.
// Kural yeni planlar için de mevcut taslağın güncellenmesi için de geçerlidir: taslak geleceğe
// dönük bir plandır. Geçmiş planlar ise silinmez, araçla ilişkileri korunarak listelenir.
async function assertVehicleUsable(trx: Knex.Transaction, vehicleId: string) {
  const vehicle = await repo.lockVehicle(trx, vehicleId);
  if (!vehicle) {
    throw new HttpError(400, 'VEHICLE_NOT_FOUND', 'Seçilen araç bulunamadı.', { field: 'vehicleId' });
  }
  if (!vehicle.is_active) {
    throw new HttpError(409, 'VEHICLE_INACTIVE', 'Seçilen araç pasif yapılmış. Lütfen aktif bir araç seçin.', {
      field: 'vehicleId',
    });
  }
}

export const routePlanService = {
  list(vehicleId?: string) {
    return repo.list(vehicleId);
  },

  async get(id: string): Promise<RoutePlanDetail> {
    const plan = await repo.findById(id);
    if (!plan) throw notFound();
    return plan;
  },

  // created=false: aynı clientRequestId ile daha önce kaydedilmiş plan geri döner (çift tıklama, ağ tekrarı).
  async create(input: CreateRoutePlanInput): Promise<{ plan: RoutePlanDetail; created: boolean }> {
    const { clientRequestId, ...fields } = input;

    if (clientRequestId) {
      const existingId = await repo.findIdByClientRequestId(clientRequestId);
      if (existingId) return { plan: await this.get(existingId), created: false };
    }

    let id: string;
    try {
      id = await db.transaction(async (trx) => {
        await assertVehicleUsable(trx, fields.vehicleId);
        const planId = await repo.insertPlan(trx, fields, clientRequestId);
        await repo.replaceStops(trx, planId, fields.stops);
        return planId;
      });
    } catch (err) {
      // Yukarıdaki kontrolden geçen iki eşzamanlı istekten ikincisi buraya düşer.
      if (clientRequestId && isUniqueViolation(err, 'route_plans_client_request_id_unique')) {
        const existingId = await repo.findIdByClientRequestId(clientRequestId);
        if (existingId) return { plan: await this.get(existingId), created: false };
      }
      throw err;
    }

    return { plan: await this.get(id), created: true };
  },

  async update(id: string, input: UpdateRoutePlanInput): Promise<RoutePlanDetail> {
    await db.transaction(async (trx) => {
      if (!(await repo.lockPlan(trx, id))) throw notFound();
      await assertVehicleUsable(trx, input.vehicleId);
      await repo.updatePlan(trx, id, input);
      await repo.replaceStops(trx, id, input.stops);
    });
    return this.get(id);
  },
};
