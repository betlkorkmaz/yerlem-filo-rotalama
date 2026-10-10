import { z } from 'zod';

export const MIN_STOPS = 3; // başlangıç + en az 1 ara durak + bitiş
export const MAX_STOPS = 25;

const coordinate = (label: string, limit: number) =>
  z
    .number({ error: `${label} sayı olmalıdır.` })
    .min(-limit, { error: `${label} -${limit} ile ${limit} arasında olmalıdır.` })
    .max(limit, { error: `${label} -${limit} ile ${limit} arasında olmalıdır.` });

export const stopSchema = z.object({
  name: z
    .string({ error: 'Durak adı zorunludur.' })
    .trim()
    .min(1, { error: 'Durak adı zorunludur.' })
    .max(100, { error: 'Durak adı en fazla 100 karakter olabilir.' }),
  latitude: coordinate('Enlem', 90),
  longitude: coordinate('Boylam', 180),
});

// Rota çizgisi GeoJSON biçiminde saklanır: [boylam, enlem] çiftleri.
const geometrySchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
});

const routePlanFields = z.object({
  name: z
    .string({ error: 'Plan adı zorunludur.' })
    .trim()
    .min(1, { error: 'Plan adı zorunludur.' })
    .max(100, { error: 'Plan adı en fazla 100 karakter olabilir.' }),
  vehicleId: z.uuid({ error: 'Araç seçin.' }),
  // Sıra bilgisi gönderilmez; listenin sırası durak sırasıdır. Backend 0..n olarak yeniden numaralar.
  stops: z
    .array(stopSchema)
    .min(MIN_STOPS, { error: 'Başlangıç, bitiş ve en az bir ara durak gerekli.' })
    .max(MAX_STOPS, { error: `En fazla ${MAX_STOPS} durak eklenebilir.` }),
  // Rota hesaplanamadıysa (servis çalışmıyorsa) taslak bu alanlar olmadan da kaydedilebilir.
  distanceM: z.number().int().nonnegative().nullable().default(null),
  durationS: z.number().int().nonnegative().nullable().default(null),
  geometry: geometrySchema.nullable().default(null),
});

export const createRoutePlanSchema = routePlanFields.extend({
  // Aynı "Kaydet" isteği tekrar gelirse ikinci plan açılmasın diye istemcinin ürettiği anahtar.
  clientRequestId: z.uuid().optional(),
});

export const updateRoutePlanSchema = routePlanFields;

export const routePlanIdParamsSchema = z.object({
  id: z.uuid({ error: 'Geçersiz plan kimliği.' }),
});

export const listRoutePlansQuerySchema = z.object({
  vehicleId: z.uuid({ error: 'Geçersiz araç kimliği.' }).optional(),
});

export const calculateRouteSchema = z.object({
  stops: z
    .array(stopSchema.pick({ latitude: true, longitude: true }))
    .min(2, { error: 'Rota için en az iki durak gerekli.' })
    .max(MAX_STOPS, { error: `En fazla ${MAX_STOPS} durak eklenebilir.` }),
});

export type StopInput = z.infer<typeof stopSchema>;
export type CreateRoutePlanInput = z.infer<typeof createRoutePlanSchema>;
export type UpdateRoutePlanInput = z.infer<typeof updateRoutePlanSchema>;
export type RouteGeometry = z.infer<typeof geometrySchema>;
export type CalculateRouteInput = z.infer<typeof calculateRouteSchema>;

export interface RouteStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

// Plan araç bilgisini kopyalamaz; listede ve detayda ilişkiden (JOIN) güncel hali gelir.
export interface RoutePlanVehicle {
  id: string;
  plate: string;
  name: string;
  capacity: number;
  isActive: boolean;
}

export interface RoutePlanSummary {
  id: string;
  name: string;
  status: 'draft';
  distanceM: number | null;
  durationS: number | null;
  stopCount: number;
  vehicle: RoutePlanVehicle;
  createdAt: string;
  updatedAt: string;
}

export interface RoutePlanDetail extends Omit<RoutePlanSummary, 'stopCount'> {
  geometry: RouteGeometry | null;
  stops: RouteStop[];
}
