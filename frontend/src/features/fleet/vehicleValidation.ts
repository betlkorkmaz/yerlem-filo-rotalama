import type { FieldErrors } from '../../api/client';
import { VEHICLE_TYPES, type VehicleInput, type VehicleType } from '../../api/vehicles';
import { PLATE_PATTERN, normalizePlate } from './vehicleUtils';

// Form alanları kullanıcının yazdığı haliyle (metin) tutulur; sayıya kayıtta çevrilir.
export interface VehicleFormValues {
  plate: string;
  name: string;
  type: VehicleType | '';
  capacity: string;
  isActive: boolean;
}

export const emptyVehicleForm: VehicleFormValues = {
  plate: '',
  name: '',
  type: '',
  capacity: '',
  isActive: true,
};

// İstemci doğrulaması kullanıcıya hızlı geri bildirim içindir; asıl kural backend'dedir.
// Sunucudan gelen alan hataları da aynı { alan: mesaj } biçiminde forma yansıtılır.
export function validateVehicleForm(values: VehicleFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const plate = normalizePlate(values.plate);
  if (!plate) errors.plate = 'Plaka zorunludur.';
  else if (!PLATE_PATTERN.test(plate)) errors.plate = 'Geçerli bir plaka girin (ör. 34 ABC 123).';

  const name = values.name.trim();
  if (!name) errors.name = 'Ad/kod zorunludur.';
  else if (name.length > 50) errors.name = 'Ad/kod en fazla 50 karakter olabilir.';

  if (!VEHICLE_TYPES.includes(values.type as VehicleType)) errors.type = 'Araç tipi seçin.';

  const capacity = Number(values.capacity);
  if (values.capacity.trim() === '') errors.capacity = 'Kapasite zorunludur.';
  else if (!Number.isInteger(capacity)) errors.capacity = 'Kapasite tam sayı olmalıdır.';
  else if (capacity < 1 || capacity > 100) errors.capacity = 'Kapasite 1 ile 100 arasında olmalıdır.';

  return errors;
}

export function toVehicleInput(values: VehicleFormValues): VehicleInput {
  return {
    plate: values.plate,
    name: values.name.trim(),
    type: values.type as VehicleType,
    capacity: Number(values.capacity),
    isActive: values.isActive,
  };
}
