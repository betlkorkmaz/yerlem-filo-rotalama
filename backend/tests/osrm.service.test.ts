import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateRoute } from '../src/modules/routing/osrm.service';
import { HttpError } from '../src/lib/httpError';

// Rota servisi dış bir bağımlılık; cevapları fetch taklit edilerek sınanır, gerçek servise gidilmez.
const input = {
  stops: [
    { latitude: 40.99, longitude: 29.02 },
    { latitude: 41.07, longitude: 29.01 },
  ],
};

const respond = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));

async function expectHttpError(status: number, code: string) {
  const err = await calculateRoute(input).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(HttpError);
  expect(err).toMatchObject({ status, code });
}

describe('OSRM rota servisi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('başarılı cevabı mesafe/süre/çizgiye çevirir ve OSRM sırasıyla (boylam,enlem) istek atar', async () => {
    respond(200, {
      code: 'Ok',
      routes: [{ distance: 13771.4, duration: 899.6, geometry: { type: 'LineString', coordinates: [[29.02, 40.99], [29.01, 41.07]] } }],
      waypoints: [{ distance: 3 }, { distance: 5 }],
    });

    const result = await calculateRoute(input);

    expect(result).toEqual({
      distanceM: 13771,
      durationS: 900,
      geometry: { type: 'LineString', coordinates: [[29.02, 40.99], [29.01, 41.07]] },
    });
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/route/v1/driving/29.02,40.99;29.01,41.07');
  });

  it('zaman aşımında 504 döner', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('timeout'), { name: 'TimeoutError' })));
    await expectHttpError(504, 'ROUTING_TIMEOUT');
  });

  it('servise ulaşılamazsa 502 döner', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expectHttpError(502, 'ROUTING_UNAVAILABLE');
  });

  it('JSON olmayan cevapta 502 döner', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>hata</html>', { status: 200 })));
    await expectHttpError(502, 'ROUTING_BAD_RESPONSE');
  });

  it('karayolu rotası yoksa 422 döner', async () => {
    respond(400, { code: 'NoRoute' });
    await expectHttpError(422, 'ROUTE_NOT_FOUND');
  });

  // OSRM denizdeki noktayı yüzlerce km öteye "yapıştırıp" 0 metrelik rota dönebiliyordu.
  it('yola çok uzak durağı (2 km üzeri) 422 ve durak sırasıyla reddeder', async () => {
    respond(200, {
      code: 'Ok',
      routes: [{ distance: 0, duration: 0, geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] } }],
      waypoints: [{ distance: 10 }, { distance: 1_500_000 }],
    });
    const err = await calculateRoute(input).catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 422, code: 'STOP_OFF_ROAD', details: { stopIndex: 1 } });
  });
});
