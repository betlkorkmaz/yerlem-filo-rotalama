import type { FieldErrors } from '../../api/client';
import type { StopInput } from '../../api/routePlans';
import type { EditorStop } from './store/useRouteEditorStore';

export const MIN_STOPS = 2; // başlangıç + bitiş; ara duraklar isteğe bağlı
export const MAX_STOPS = 25;

export function formatDistance(meters: number | null): string {
  if (meters == null) return '—';
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours} sa ${minutes % 60} dk` : `${hours} sa`;
}

export type StopField = 'search' | 'name' | 'latitude' | 'longitude';
export const stopFieldId = (index: number, field: StopField) => `stop-${index}-${field}`;

export function stopLabel(index: number, total: number): string {
  if (index === 0) return 'Başlangıç';
  if (index === total - 1) return 'Bitiş';
  return `${index}. ara durak`;
}

// Virgüllü ondalık da kabul edilir ("40,99"): Türkçe klavyede doğal olan budur.
const parseCoordinate = (value: string) => {
  const text = value.trim().replace(',', '.');
  return text === '' ? NaN : Number(text);
};

export const isValidLatitude = (n: number) => Number.isFinite(n) && n >= -90 && n <= 90;
export const isValidLongitude = (n: number) => Number.isFinite(n) && n >= -180 && n <= 180;

export function toStopInput(stop: EditorStop): StopInput {
  return {
    name: stop.name.trim(),
    latitude: parseCoordinate(stop.latitude),
    longitude: parseCoordinate(stop.longitude),
  };
}

// Haritada gösterilebilecek (koordinatı geçerli) duraklar, listedeki sıralarıyla.
export function mappableStops(stops: EditorStop[]) {
  return stops
    .map((stop, index) => ({ ...toStopInput(stop), index }))
    .filter((s) => isValidLatitude(s.latitude) && isValidLongitude(s.longitude));
}

// Hata anahtarları backend'in alan adlarıyla aynıdır (ör. "stops.1.latitude"),
// böylece sunucudan gelen hatalar da aynı alanın altında gösterilir.
export function validateCoordinates(stops: EditorStop[]): FieldErrors {
  const errors: FieldErrors = {};
  stops.forEach((stop, i) => {
    // Hiç konum girilmemişse "aralık dışı" demek anlamsız; kullanıcıya nasıl konum seçeceği söylenir.
    if (!stop.latitude.trim() && !stop.longitude.trim()) {
      errors[`stops.${i}.location`] = 'Konum seçilmedi: adres arayıp sonuçtan seçin veya haritaya dokunun.';
      return;
    }
    const { latitude, longitude } = toStopInput(stop);
    if (!isValidLatitude(latitude)) errors[`stops.${i}.latitude`] = 'Enlem -90 ile 90 arasında olmalı.';
    if (!isValidLongitude(longitude)) errors[`stops.${i}.longitude`] = 'Boylam -180 ile 180 arasında olmalı.';
  });
  return errors;
}

export function validatePlan(values: { name: string; vehicleId: string; stops: EditorStop[] }): FieldErrors {
  const errors: FieldErrors = validateCoordinates(values.stops);
  if (!values.name.trim()) errors.name = 'Plan adı zorunludur.';
  if (!values.vehicleId) errors.vehicleId = 'Araç seçin.';
  if (values.stops.length < MIN_STOPS) errors.stops = 'Başlangıç ve bitiş durağı gerekli.';
  values.stops.forEach((stop, i) => {
    if (!stop.name.trim()) errors[`stops.${i}.name`] = 'Durak adı zorunludur.';
  });
  return errors;
}
