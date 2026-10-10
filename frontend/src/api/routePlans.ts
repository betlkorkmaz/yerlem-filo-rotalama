import { ApiError, apiRequest } from './client';

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [boylam, enlem]
}

export interface RouteResult {
  distanceM: number;
  durationS: number;
  geometry: RouteGeometry;
}

export interface StopInput {
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteStop extends StopInput {
  id: string;
  sequence: number;
}

// Plan araç bilgisini kopyalamaz; backend ilişkiden aracın güncel halini getirir.
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

export interface RoutePlanInput {
  name: string;
  vehicleId: string;
  stops: StopInput[];
  distanceM: number | null;
  durationS: number | null;
  geometry: RouteGeometry | null;
}

export async function listRoutePlans(): Promise<RoutePlanSummary[]> {
  const data = await apiRequest<unknown>('/route-plans');
  if (!Array.isArray(data)) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Rota planları beklenen biçimde gelmedi.');
  }
  return data as RoutePlanSummary[];
}

export function getRoutePlan(id: string, signal?: AbortSignal) {
  return apiRequest<RoutePlanDetail>(`/route-plans/${id}`, { signal });
}

export function createRoutePlan(input: RoutePlanInput, clientRequestId: string) {
  return apiRequest<RoutePlanDetail>('/route-plans', { method: 'POST', body: { ...input, clientRequestId } });
}

export function updateRoutePlan(id: string, input: RoutePlanInput) {
  return apiRequest<RoutePlanDetail>(`/route-plans/${id}`, { method: 'PUT', body: input });
}

// Backend kendi rota servisi zaman aşımını (8 sn) uygular; istemci ondan biraz daha uzun bekler.
export function calculateRoute(stops: Pick<StopInput, 'latitude' | 'longitude'>[]) {
  return apiRequest<RouteResult>('/routing/calculate', { method: 'POST', body: { stops }, timeoutMs: 12_000 });
}
