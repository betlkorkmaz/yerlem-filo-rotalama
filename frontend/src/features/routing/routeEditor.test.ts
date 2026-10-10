import { beforeEach, describe, expect, it } from 'vitest';
import { useRouteEditorStore } from './store/useRouteEditorStore';
import { validateCoordinates, validatePlan } from './routeUtils';

const editor = () => useRouteEditorStore.getState();
const route = { distanceM: 1000, durationS: 60, geometry: { type: 'LineString' as const, coordinates: [[29, 41], [29.1, 41.1]] as [number, number][] } };

describe('Rota düzenleyici store kuralları', () => {
  beforeEach(() => editor().startNew());

  it('yeni plan başlangıç ve bitiş olmak üzere iki durakla açılır', () => {
    expect(editor().stops).toHaveLength(2);
  });

  it('ara durak bitişten önceye eklenir; bitiş hep son durak kalır', () => {
    const [, end] = editor().stops;
    editor().addStop({ name: 'Ara' });
    const stops = editor().stops;
    expect(stops).toHaveLength(3);
    expect(stops[1].name).toBe('Ara');
    expect(stops[2].key).toBe(end.key);
  });

  // Eski rota yeni duraklarla birlikte kaydedilmesin diye.
  it('durak sırası veya koordinatı değişince hesaplanan rota silinir', () => {
    editor().setRoute(route);
    editor().moveStop(editor().stops[0].key, 1);
    expect(editor().route).toBeNull();

    editor().setRoute(route);
    editor().updateStop(editor().stops[0].key, { latitude: '41.1' });
    expect(editor().route).toBeNull();
  });

  it('sadece durak adı değişince rota korunur', () => {
    editor().setRoute(route);
    editor().updateStop(editor().stops[0].key, { name: 'Yeni ad' });
    expect(editor().route).toEqual(route);
  });

  it('her yeni plan ekranı farklı bir çift kayıt anahtarı (clientRequestId) üretir', () => {
    const first = editor().clientRequestId;
    editor().startNew();
    expect(editor().clientRequestId).not.toBe(first);
  });
});

describe('Durak doğrulama', () => {
  const stop = (latitude: string, longitude: string, name = 'Durak') => ({ key: name + latitude, name, latitude, longitude });

  it('konumu hiç seçilmemiş durak için yol gösteren mesaj verir', () => {
    expect(validateCoordinates([stop('', '')])).toEqual({
      'stops.0.location': 'Konum seçilmedi: adres arayıp sonuçtan seçin veya haritaya dokunun.',
    });
  });

  it('aralık dışı koordinatları reddeder, virgüllü ondalığı kabul eder', () => {
    const errors = validateCoordinates([stop('95', '29'), stop('40,99', '29,02')]);
    expect(errors['stops.0.latitude']).toBeDefined();
    expect(errors['stops.1.latitude']).toBeUndefined();
  });

  it('en az başlangıç ve bitiş ister; plan adı ve araç zorunludur', () => {
    const errors = validatePlan({ name: ' ', vehicleId: '', stops: [stop('41', '29')] });
    expect(errors).toMatchObject({
      name: 'Plan adı zorunludur.',
      vehicleId: 'Araç seçin.',
      stops: 'Başlangıç ve bitiş durağı gerekli.',
    });
  });
});
