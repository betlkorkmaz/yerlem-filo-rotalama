import { config } from '../../config';
import { HttpError } from '../../lib/httpError';
import type { CalculateRouteInput, RouteGeometry } from '../route-plans/routePlan.schema';

export interface RouteResult {
  distanceM: number;
  durationS: number;
  geometry: RouteGeometry;
}

interface OsrmResponse {
  code?: string;
  routes?: { distance?: number; duration?: number; geometry?: RouteGeometry }[];
  // distance: durağın, eşleştirildiği en yakın yola uzaklığı (metre).
  waypoints?: { distance?: number }[];
}

// OSRM her noktayı ne kadar uzakta olursa olsun en yakın yola "yapıştırır". Denizin ortasındaki bir
// durak yüzlerce km öteye taşınıp 0 metrelik anlamsız bir rota üretebiliyordu; bu eşikten uzak
// duraklar hatalı sayılır.
const MAX_SNAP_DISTANCE_M = 2000;

// Rota servisi dış bir bağımlılıktır; yavaşlayabilir, kapanabilir veya rota bulamayabilir.
// Her durum ayrı bir koda çevrilir ki kullanıcı ne olduğunu ve ne yapabileceğini anlasın.
// Servis hata verse de veritabanına hiçbir şey yazılmaz: hesaplama ile kaydetme ayrı işlemlerdir.
export async function calculateRoute({ stops }: CalculateRouteInput): Promise<RouteResult> {
  // OSRM sırası boylam,enlem'dir.
  const coords = stops.map((s) => `${s.longitude},${s.latitude}`).join(';');
  const url = `${config.osrmUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(config.osrmTimeoutMs) });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new HttpError(504, 'ROUTING_TIMEOUT', 'Rota servisi zamanında yanıt vermedi. Lütfen tekrar deneyin.');
    }
    throw new HttpError(502, 'ROUTING_UNAVAILABLE', 'Rota servisine şu anda ulaşılamıyor.');
  }

  let data: OsrmResponse;
  try {
    data = (await response.json()) as OsrmResponse;
  } catch {
    throw new HttpError(502, 'ROUTING_BAD_RESPONSE', 'Rota servisinden geçersiz cevap alındı.');
  }

  // OSRM, karayoluyla bağlanamayan noktalar için 400 + NoRoute/NoSegment döner.
  // Bu bir servis arızası değil, girdiyle ilgili bir sonuçtur; kullanıcı durakları değiştirebilir.
  if (data.code === 'NoRoute' || data.code === 'NoSegment') {
    throw new HttpError(422, 'ROUTE_NOT_FOUND', 'Bu duraklar arasında karayolu rotası bulunamadı.');
  }

  const farStop = data.waypoints?.findIndex((w) => (w.distance ?? 0) > MAX_SNAP_DISTANCE_M) ?? -1;
  if (farStop >= 0) {
    throw new HttpError(
      422,
      'STOP_OFF_ROAD',
      `${farStop + 1}. durak karayoluna çok uzak. Koordinatları kontrol edin.`,
      { stopIndex: farStop },
    );
  }

  const route = data.routes?.[0];
  if (!response.ok || data.code !== 'Ok' || !route?.geometry || route.distance == null || route.duration == null) {
    throw new HttpError(502, 'ROUTING_BAD_RESPONSE', 'Rota servisi beklenen sonucu döndürmedi.');
  }

  return {
    distanceM: Math.round(route.distance),
    durationS: Math.round(route.duration),
    geometry: { type: 'LineString', coordinates: route.geometry.coordinates },
  };
}
