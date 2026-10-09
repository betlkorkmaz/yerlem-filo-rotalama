import { z } from 'zod';

export const VEHICLE_TYPES = ['bus', 'midibus', 'minibus', 'van'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

// " 34 abc 123 " → "34ABC123". Aynı plakanın farklı yazımları tek bir değere iner;
// benzersizlik bu değer üzerinden kontrol edildiği için yazım farkıyla tekrar kayıt açılamaz.
// toLocaleUpperCase('tr') bilerek kullanılmadı: "i" harfini "İ" yapar ve plaka biçimine uymaz.
export function normalizePlate(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

// Türkiye plaka biçimi: il kodu (01–81) + 1–3 harf + 2–4 rakam.
const PLATE_PATTERN = /^(0[1-9]|[1-7]\d|8[01])[A-Z]{1,3}\d{2,4}$/;

const plateSchema = z
  .string({ error: 'Plaka zorunludur.' })
  .transform(normalizePlate)
  .pipe(
    z
      .string()
      .min(1, { error: 'Plaka zorunludur.' })
      .regex(PLATE_PATTERN, { error: 'Geçerli bir plaka girin (ör. 34 ABC 123).' }),
  );

const vehicleFields = z.object({
  plate: plateSchema,
  name: z
    .string({ error: 'Ad/kod zorunludur.' })
    .trim()
    .min(1, { error: 'Ad/kod zorunludur.' })
    .max(50, { error: 'Ad/kod en fazla 50 karakter olabilir.' }),
  type: z.enum(VEHICLE_TYPES, { error: 'Geçerli bir araç tipi seçin.' }),
  capacity: z
    .number({ error: 'Kapasite sayı olmalıdır.' })
    .int({ error: 'Kapasite tam sayı olmalıdır.' })
    .min(1, { error: 'Kapasite en az 1 olmalıdır.' })
    .max(100, { error: 'Kapasite en fazla 100 olabilir.' }),
  isActive: z.boolean({ error: 'Aktiflik durumu true/false olmalıdır.' }),
});

export const createVehicleSchema = vehicleFields.extend({
  isActive: vehicleFields.shape.isActive.default(true),
});

// Düzenlemede yalnızca gönderilen alanlar değişir (ör. sadece aktif/pasif).
// Varsayılan değer bilerek create şemasında: burada olsaydı, isActive gönderilmeyen her
// düzenleme pasif aracı sessizce yeniden aktif yapardı.
export const updateVehicleSchema = vehicleFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: 'Güncellenecek en az bir alan gönderin.' });

export const listVehiclesQuerySchema = z.object({
  search: z.string().trim().max(50).optional(),
  status: z
    .enum(['all', 'active', 'inactive'], { error: 'Durum all, active veya inactive olmalıdır.' })
    .default('all'),
});

export const vehicleIdParamsSchema = z.object({
  id: z.uuid({ error: 'Geçersiz araç kimliği.' }),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;

// API'nin dışarıya verdiği biçim (camelCase). Veritabanı kolon adları dışarı sızmaz.
export interface Vehicle {
  id: string;
  plate: string;
  name: string;
  type: VehicleType;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
