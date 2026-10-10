import type { FieldErrors } from '../../api/client';
import type { StopInput } from '../../api/routePlans';
import type { EditorStop } from './store/useRouteEditorStore';

export const MIN_STOPS = 3;
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

export const stopFieldId = (index: number, field: 'name' | 'latitude' | 'longitude') => `stop-${index}-${field}`;

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
  if (values.stops.length < MIN_STOPS) errors.stops = 'Başlangıç, bitiş ve en az bir ara durak gerekli.';
  values.stops.forEach((stop, i) => {
    if (!stop.name.trim()) errors[`stops.${i}.name`] = 'Durak adı zorunludur.';
  });
  return errors;
}
