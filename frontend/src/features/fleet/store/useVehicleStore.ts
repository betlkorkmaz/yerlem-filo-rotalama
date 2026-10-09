import { create } from 'zustand';
import * as vehiclesApi from '../../../api/vehicles';
import type { Vehicle, VehicleInput } from '../../../api/vehicles';
import { ApiError } from '../../../api/client';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface VehicleState {
  // Filonun istemcideki tek kopyası. Filo ve rotalama ekranları araçları buradan okur;
  // başka hiçbir store araç bilgisini kopyalamaz, sadece id'sini tutar.
  vehicles: Vehicle[];
  listStatus: LoadStatus;
  listError: ApiError | null;
  fetchVehicles: () => Promise<void>;
  fetchVehicle: (id: string) => Promise<Vehicle>;
  createVehicle: (input: VehicleInput) => Promise<Vehicle>;
  updateVehicle: (id: string, input: Partial<VehicleInput>) => Promise<Vehicle>;
}

const toApiError = (err: unknown) =>
  err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', 'Beklenmeyen bir hata oluştu.');

// Tek bir aracı listeye ekler ya da listedeki eski halini günceller.
const upsert = (list: Vehicle[], vehicle: Vehicle) =>
  list.some((v) => v.id === vehicle.id)
    ? list.map((v) => (v.id === vehicle.id ? vehicle : v))
    : [vehicle, ...list];

// Üst üste gelen liste isteklerinde yalnızca en son isteğin cevabı yazılır;
// geç dönen eski bir cevap yeni veriyi ezmesin diye.
let latestListRequest = 0;

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  listStatus: 'idle',
  listError: null,

  fetchVehicles: async () => {
    const requestId = ++latestListRequest;
    set({ listStatus: 'loading', listError: null });
    try {
      const vehicles = await vehiclesApi.listVehicles();
      if (requestId === latestListRequest) set({ vehicles, listStatus: 'success' });
    } catch (err) {
      if (requestId === latestListRequest) set({ listStatus: 'error', listError: toApiError(err) });
    }
  },

  fetchVehicle: async (id) => {
    const vehicle = await vehiclesApi.getVehicle(id);
    set((s) => ({ vehicles: upsert(s.vehicles, vehicle) }));
    return vehicle;
  },

  createVehicle: async (input) => {
    const vehicle = await vehiclesApi.createVehicle(input);
    set((s) => ({ vehicles: upsert(s.vehicles, vehicle) }));
    return vehicle;
  },

  updateVehicle: async (id, input) => {
    const vehicle = await vehiclesApi.updateVehicle(id, input);
    set((s) => ({ vehicles: upsert(s.vehicles, vehicle) }));
    return vehicle;
  },
}));
