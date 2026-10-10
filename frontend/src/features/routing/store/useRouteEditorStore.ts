import { create } from 'zustand';
import type { RouteGeometry, RoutePlanDetail, RouteResult } from '../../../api/routePlans';
import { createId } from '../../../shared/uuid';

// Form alanları kullanıcının yazdığı haliyle (metin) tutulur; kayıtta sayıya çevrilir.
export interface EditorStop {
  key: string; // listede yeniden sıralamada React'in satırları karıştırmaması için sabit anahtar
  name: string;
  latitude: string;
  longitude: string;
}

interface RouteEditorState {
  planId: string | null; // null = yeni plan
  // Yeni plan ekranı açıldığında bir kez üretilir; "Kaydet" kaç kez gönderilirse gönderilsin aynı kalır.
  clientRequestId: string;
  name: string;
  // Araç bilgisi kopyalanmaz; sadece id tutulur, ayrıntı useVehicleStore'dan okunur.
  vehicleId: string;
  stops: EditorStop[];
  route: RouteResult | null;
  dirty: boolean;

  startNew: () => void;
  loadPlan: (plan: RoutePlanDetail) => void;
  setName: (name: string) => void;
  setVehicleId: (vehicleId: string) => void;
  addStop: (stop?: Partial<Omit<EditorStop, 'key'>>) => void;
  updateStop: (key: string, patch: Partial<Omit<EditorStop, 'key'>>) => void;
  removeStop: (key: string) => void;
  moveStop: (key: string, direction: -1 | 1) => void;
  setRoute: (route: RouteResult) => void;
  markSaved: (plan: RoutePlanDetail) => void;
}

const newKey = createId;
const emptyStop = (): EditorStop => ({ key: newKey(), name: '', latitude: '', longitude: '' });

const toRoute = (plan: RoutePlanDetail): RouteResult | null =>
  plan.geometry && plan.distanceM != null && plan.durationS != null
    ? { distanceM: plan.distanceM, durationS: plan.durationS, geometry: plan.geometry as RouteGeometry }
    : null;

const fromPlan = (plan: RoutePlanDetail) => ({
  planId: plan.id,
  name: plan.name,
  vehicleId: plan.vehicle.id,
  stops: plan.stops.map((s) => ({
    key: newKey(),
    name: s.name,
    latitude: String(s.latitude),
    longitude: String(s.longitude),
  })),
  route: toRoute(plan),
  dirty: false,
});

// Duraklar değiştiğinde hesaplanmış rota artık bu duraklara ait değildir; silinir.
// Böylece eski rota yeni duraklarla birlikte asla kaydedilemez.
const stopsChanged = (stops: EditorStop[]) => ({ stops, route: null, dirty: true });

export const useRouteEditorStore = create<RouteEditorState>((set) => ({
  planId: null,
  clientRequestId: newKey(),
  name: '',
  vehicleId: '',
  stops: [],
  route: null,
  dirty: false,

  // Başlangıç ve bitiş için iki boş satırla açılır; ara duraklar isteğe bağlı eklenir.
  startNew: () =>
    set({
      planId: null,
      clientRequestId: newKey(),
      name: '',
      vehicleId: '',
      stops: [emptyStop(), emptyStop()],
      route: null,
      dirty: false,
    }),

  loadPlan: (plan) => set(fromPlan(plan)),

  setName: (name) => set({ name, dirty: true }),
  setVehicleId: (vehicleId) => set({ vehicleId, dirty: true }),

  // Yeni durak bitişten önceye eklenir: bitiş her zaman listenin son elemanı kalır.
  addStop: (stop) =>
    set((s) => {
      const added = { ...emptyStop(), ...stop };
      const stops = s.stops.length < 2 ? [...s.stops, added] : [...s.stops.slice(0, -1), added, s.stops.at(-1)!];
      return stopsChanged(stops);
    }),

  updateStop: (key, patch) =>
    set((s) => {
      const stops = s.stops.map((stop) => (stop.key === key ? { ...stop, ...patch } : stop));
      // Sadece ad değiştiyse rota geçerliliğini korur.
      const coordsChanged = 'latitude' in patch || 'longitude' in patch;
      return coordsChanged ? stopsChanged(stops) : { stops, dirty: true };
    }),

  removeStop: (key) => set((s) => stopsChanged(s.stops.filter((stop) => stop.key !== key))),

  moveStop: (key, direction) =>
    set((s) => {
      const from = s.stops.findIndex((stop) => stop.key === key);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= s.stops.length) return s;
      const stops = [...s.stops];
      [stops[from], stops[to]] = [stops[to], stops[from]];
      return stopsChanged(stops);
    }),

  setRoute: (route) => set({ route }),

  markSaved: (plan) => set(fromPlan(plan)),
}));
