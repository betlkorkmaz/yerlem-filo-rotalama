import type { Knex } from 'knex';
import { db } from '../../db/knex';
import type {
  RouteGeometry,
  RoutePlanDetail,
  RoutePlanSummary,
  RouteStop,
  StopInput,
  UpdateRoutePlanInput,
} from './routePlan.schema';

interface PlanRow {
  id: string;
  name: string;
  status: 'draft';
  distance_m: number | null;
  duration_s: number | null;
  geometry?: RouteGeometry | null;
  stop_count?: number;
  created_at: Date;
  updated_at: Date;
  v_id: string;
  v_plate: string;
  v_name: string;
  v_capacity: number;
  v_is_active: boolean;
}

interface StopRow {
  id: string;
  name: string;
  latitude: string; // PostgreSQL numeric tipi hassasiyet kaybı olmasın diye metin olarak gelir
  longitude: string;
  sequence: number;
}

// Plan + aracın güncel bilgisi tek sorguda. Araç pasif olsa veya adı değişse bile
// plan her zaman ilişkiden okunduğu için geçmiş plan aracın son halini gösterir.
const planWithVehicle = (q: Knex = db) =>
  q('route_plans as p')
    .join('vehicles as v', 'v.id', 'p.vehicle_id')
    .select(
      'p.id',
      'p.name',
      'p.status',
      'p.distance_m',
      'p.duration_s',
      'p.created_at',
      'p.updated_at',
      'v.id as v_id',
      'v.plate as v_plate',
      'v.name as v_name',
      'v.capacity as v_capacity',
      'v.is_active as v_is_active',
    );

const toSummaryBase = (row: PlanRow) => ({
  id: row.id,
  name: row.name,
  status: row.status,
  distanceM: row.distance_m,
  durationS: row.duration_s,
  vehicle: {
    id: row.v_id,
    plate: row.v_plate,
    name: row.v_name,
    capacity: row.v_capacity,
    isActive: row.v_is_active,
  },
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const toStop = (row: StopRow): RouteStop => ({
  id: row.id,
  name: row.name,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  sequence: row.sequence,
});

const planColumns = (input: UpdateRoutePlanInput) => ({
  name: input.name,
  vehicle_id: input.vehicleId,
  distance_m: input.distanceM,
  duration_s: input.durationS,
  // jsonb kolonuna nesne olarak değil JSON metni olarak yazılır (pg sürücüsü dizileri farklı çevirir).
  geometry: input.geometry ? JSON.stringify(input.geometry) : null,
});

export const routePlanRepository = {
  async list(vehicleId?: string): Promise<RoutePlanSummary[]> {
    const query = planWithVehicle()
      .select(db.raw('(select count(*)::int from route_stops s where s.route_plan_id = p.id) as stop_count'))
      .orderBy('p.updated_at', 'desc');
    if (vehicleId) query.where('p.vehicle_id', vehicleId);

    const rows: PlanRow[] = await query;
    return rows.map((row) => ({ ...toSummaryBase(row), stopCount: row.stop_count ?? 0 }));
  },

  async findById(id: string, trx: Knex = db): Promise<RoutePlanDetail | undefined> {
    const row: PlanRow | undefined = await planWithVehicle(trx).select('p.geometry').where('p.id', id).first();
    if (!row) return undefined;

    const stops: StopRow[] = await trx('route_stops').where({ route_plan_id: id }).orderBy('sequence');
    return { ...toSummaryBase(row), geometry: row.geometry ?? null, stops: stops.map(toStop) };
  },

  async findIdByClientRequestId(clientRequestId: string): Promise<string | undefined> {
    const row = await db('route_plans').where({ client_request_id: clientRequestId }).first('id');
    return row?.id;
  },

  // FOR SHARE: bu işlem bitene kadar aracın satırı başka bir işlemde değiştirilemez.
  // Böylece "araç aktif mi?" kontrolü ile planın kaydı arasında araç pasifleşemez.
  lockVehicle(trx: Knex.Transaction, vehicleId: string): Promise<{ is_active: boolean } | undefined> {
    return trx('vehicles').where({ id: vehicleId }).forShare().first('is_active');
  },

  // FOR UPDATE: aynı plan iki sekmeden aynı anda kaydedilirse durak yazımları birbirine karışmasın.
  lockPlan(trx: Knex.Transaction, id: string): Promise<{ id: string } | undefined> {
    return trx('route_plans').where({ id }).forUpdate().first('id');
  },

  async insertPlan(trx: Knex.Transaction, input: UpdateRoutePlanInput, clientRequestId?: string): Promise<string> {
    const [row] = await trx('route_plans')
      .insert({ ...planColumns(input), status: 'draft', client_request_id: clientRequestId ?? null })
      .returning('id');
    return row.id;
  },

  async updatePlan(trx: Knex.Transaction, id: string, input: UpdateRoutePlanInput): Promise<void> {
    await trx('route_plans')
      .where({ id })
      .update({ ...planColumns(input), updated_at: trx.fn.now() });
  },

  // Duraklar her kayıtta silinip listedeki sırayla 0..n numaralanarak yeniden yazılır.
  // Silme/sıralama sonrası boşluklu ya da çakışan sequence oluşması böylece imkânsızdır.
  async replaceStops(trx: Knex.Transaction, routePlanId: string, stops: StopInput[]): Promise<void> {
    await trx('route_stops').where({ route_plan_id: routePlanId }).delete();
    await trx('route_stops').insert(
      stops.map((s, index) => ({
        route_plan_id: routePlanId,
        name: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
        sequence: index,
      })),
    );
  },
};
