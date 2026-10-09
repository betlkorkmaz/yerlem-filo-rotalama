import { describe, expect, it } from 'vitest';
import {
  createVehicleSchema,
  normalizePlate,
  updateVehicleSchema,
} from '../src/modules/vehicles/vehicle.schema';

describe('normalizePlate', () => {
  it.each([
    ['34 ABC 123', '34ABC123'],
    ['34abc123', '34ABC123'],
    ['  34 aBc   123 ', '34ABC123'],
    ['06\tgh 789', '06GH789'],
  ])('"%s" → "%s"', (raw, expected) => {
    expect(normalizePlate(raw)).toBe(expected);
  });

  it('küçük "i" harfini Türkçe "İ" yerine "I" yapar (plaka biçimine uysun diye)', () => {
    expect(normalizePlate('34 iz 12')).toBe('34IZ12');
  });
});

describe('createVehicleSchema', () => {
  const valid = { plate: '34 abc 123', name: ' SRV-01 ', type: 'bus', capacity: 50 };

  it('plakayı normalize eder, adı kırpar ve aracı varsayılan olarak aktif açar', () => {
    expect(createVehicleSchema.parse(valid)).toEqual({
      plate: '34ABC123',
      name: 'SRV-01',
      type: 'bus',
      capacity: 50,
      isActive: true,
    });
  });

  it.each([
    ['plaka biçimi bozuk', { plate: 'ABC' }, 'plate'],
    ['il kodu 81\'den büyük', { plate: '99 A 123' }, 'plate'],
    ['kapasite 0', { capacity: 0 }, 'capacity'],
    ['kapasite ondalıklı', { capacity: 1.5 }, 'capacity'],
    ['ad sadece boşluk', { name: '   ' }, 'name'],
    ['bilinmeyen tip', { type: 'tren' }, 'type'],
  ])('%s ise reddeder', (_case, override, field) => {
    const result = createVehicleSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([field]);
  });
});

describe('updateVehicleSchema', () => {
  // Hata kaydı: varsayılan isActive=true düzenlemeye sızınca pasif araç sessizce aktifleşiyordu.
  it('isActive gönderilmezse aktiflik durumuna dokunmaz', () => {
    expect(updateVehicleSchema.parse({ name: 'Yeni Ad' })).toEqual({ name: 'Yeni Ad' });
  });

  it('boş güncellemeyi reddeder', () => {
    expect(updateVehicleSchema.safeParse({}).success).toBe(false);
  });
});
