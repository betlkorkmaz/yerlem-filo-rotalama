import { ApiError, apiRequest } from './client';

export const VEHICLE_TYPES = ['bus', 'midibus', 'minibus', 'van'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

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

export interface VehicleInput {
  plate: string;
  name: string;
  type: VehicleType;
  capacity: number;
  isActive: boolean;
}

export async function listVehicles(signal?: AbortSignal): Promise<Vehicle[]> {
  const data = await apiRequest<unknown>('/vehicles', { signal });
  // Beklenen biçimde olmayan cevap ekranda "boş liste" gibi görünmesin, hata olarak ele alınsın.
  if (!Array.isArray(data)) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Araç listesi beklenen biçimde gelmedi.');
  }
  return data as Vehicle[];
}

export function getVehicle(id: string, signal?: AbortSignal) {
  return apiRequest<Vehicle>(`/vehicles/${id}`, { signal });
}

export function createVehicle(input: VehicleInput) {
  return apiRequest<Vehicle>('/vehicles', { method: 'POST', body: input });
}

export function updateVehicle(id: string, input: Partial<VehicleInput>) {
  return apiRequest<Vehicle>(`/vehicles/${id}`, { method: 'PATCH', body: input });
}
