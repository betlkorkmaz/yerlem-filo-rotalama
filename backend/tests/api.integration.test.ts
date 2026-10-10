import { afterAll, beforeEach, describe, expect, inject, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db/knex';

// Entegrasyon testleri: HTTP isteği → Express → servis → gerçek PostgreSQL. Böylece veritabanı
// kısıtları (UNIQUE, CHECK, RESTRICT) ve transaction davranışı da sınanır.
const app = createApp();

const stops = [
  { name: 'Kadıköy', latitude: 40.9907, longitude: 29.0236 },
  { name: 'Üsküdar', latitude: 41.0258, longitude: 29.015 },
  { name: 'Levent', latitude: 41.0771, longitude: 29.0118 },
];

async function createVehicle(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/vehicles')
    .send({ plate: '34 ABC 123', name: 'SRV-01', type: 'bus', capacity: 50, ...overrides });
  return res.body as { id: string; plate: string; isActive: boolean };
}

describe.skipIf(!inject('dbAvailable'))('API entegrasyon testleri', () => {
  beforeEach(async () => {
    await db.raw('truncate route_stops, route_plans, vehicles restart identity cascade');
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('Araçlar', () => {
    it('aynı plakanın farklı yazımını 409 ile reddeder', async () => {
      const first = await request(app)
        .post('/api/vehicles')
        .send({ plate: ' 34 abc 123 ', name: 'SRV-01', type: 'bus', capacity: 50 });
      expect(first.status).toBe(201);
      expect(first.body.plate).toBe('34ABC123');

      const second = await request(app)
        .post('/api/vehicles')
        .send({ plate: '34ABC123', name: 'Kopya', type: 'van', capacity: 8 });
      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('PLATE_TAKEN');
    });

    it('aynı plakayla eşzamanlı iki kayıttan yalnızca biri başarılı olur (UNIQUE kısıtı)', async () => {
      const body = { plate: '06 XYZ 99', name: 'Yarış', type: 'van', capacity: 8 };
      const results = await Promise.all([1, 2].map(() => request(app).post('/api/vehicles').send(body)));
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    });

    it('sadece adı düzenlenen pasif araç pasif kalır', async () => {
      const vehicle = await createVehicle({ isActive: false });
      const res = await request(app).patch(`/api/vehicles/${vehicle.id}`).send({ name: 'Yeni Ad' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'Yeni Ad', isActive: false });
    });

    it('planda kullanılan araç veritabanı seviyesinde silinemez (ON DELETE RESTRICT)', async () => {
      const vehicle = await createVehicle();
      await request(app).post('/api/route-plans').send({ name: 'Plan', vehicleId: vehicle.id, stops });
      await expect(db('vehicles').where({ id: vehicle.id }).delete()).rejects.toThrow(/foreign key/);
    });
  });

  describe('Rota planları', () => {
    it('pasif araçla yeni plan oluşturulamaz (409)', async () => {
      const vehicle = await createVehicle({ isActive: false });
      const res = await request(app).post('/api/route-plans').send({ name: 'Plan', vehicleId: vehicle.id, stops });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({ code: 'VEHICLE_INACTIVE', details: { field: 'vehicleId' } });
      expect(await db('route_plans').count('* as n')).toEqual([{ n: '0' }]);
    });

    it('rota ekranı açıkken araç pasif yapılırsa güncelleme reddedilir, geçmiş plan korunur', async () => {
      const vehicle = await createVehicle();
      const created = await request(app).post('/api/route-plans').send({ name: 'Plan', vehicleId: vehicle.id, stops });
      await request(app).patch(`/api/vehicles/${vehicle.id}`).send({ isActive: false });

      const update = await request(app)
        .put(`/api/route-plans/${created.body.id}`)
        .send({ name: 'Plan', vehicleId: vehicle.id, stops });
      expect(update.status).toBe(409);

      // Plan silinmez; listede aracın güncel (pasif) bilgisiyle görünür.
      const list = await request(app).get('/api/route-plans');
      expect(list.body).toHaveLength(1);
      expect(list.body[0].vehicle).toMatchObject({ id: vehicle.id, isActive: false });
    });

    it('aynı clientRequestId ile tekrarlanan istek ikinci plan oluşturmaz', async () => {
      const vehicle = await createVehicle();
      const body = { name: 'Plan', vehicleId: vehicle.id, stops, clientRequestId: '5f0c2b8e-7a1d-4c3e-9b2f-1a2b3c4d5e6f' };

      const first = await request(app).post('/api/route-plans').send(body);
      const repeated = await request(app).post('/api/route-plans').send(body);
      expect(first.status).toBe(201);
      expect(repeated.status).toBe(200);
      expect(repeated.body.id).toBe(first.body.id);

      // Aynı anda gelen 5 kopya istek de tek kayıtta kalır.
      const parallel = { ...body, clientRequestId: '0d9a1c55-3e2b-4f6a-8c7d-9e8f7a6b5c4d' };
      await Promise.all(Array.from({ length: 5 }, () => request(app).post('/api/route-plans').send(parallel)));
      expect(await db('route_plans').count('* as n')).toEqual([{ n: '2' }]);
    });

    it('durak silme ve yeniden sıralama sonrası sequence 0..n boşluksuz kalır', async () => {
      const vehicle = await createVehicle();
      const created = await request(app).post('/api/route-plans').send({ name: 'Plan', vehicleId: vehicle.id, stops });

      const reordered = [stops[2], stops[0]]; // ara durak silindi, sıra ters çevrildi
      const res = await request(app)
        .put(`/api/route-plans/${created.body.id}`)
        .send({ name: 'Plan', vehicleId: vehicle.id, stops: reordered });

      expect(res.status).toBe(200);
      expect(res.body.stops.map((s: { sequence: number; name: string }) => [s.sequence, s.name])).toEqual([
        [0, 'Levent'],
        [1, 'Kadıköy'],
      ]);
    });

    it('geçersiz koordinat ve eksik durakları alan bazlı hatalarla reddeder', async () => {
      const vehicle = await createVehicle();
      const res = await request(app)
        .post('/api/route-plans')
        .send({ name: 'Plan', vehicleId: vehicle.id, stops: [{ name: 'A', latitude: 95, longitude: 29 }] });

      expect(res.status).toBe(400);
      const fields = res.body.error.details.map((d: { field: string }) => d.field);
      expect(fields).toEqual(expect.arrayContaining(['stops.0.latitude', 'stops']));
    });
  });
});
