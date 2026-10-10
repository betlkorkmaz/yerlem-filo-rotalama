import { config } from '../../config';
import { HttpError } from '../../lib/httpError';

export interface Place {
  name: string; // durak adı olarak önerilen kısa ad, ör. "İskele (Kadıköy)"
  displayName: string; // tam adres
  latitude: number;
  longitude: number;
}

interface NominatimItem {
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
}

// Nominatim kullanım politikası (https://operations.osmfoundation.org/policies/nominatim/):
// saniyede en fazla 1 istek, uygulamayı tanıtan User-Agent ve yazarken otomatik arama yapılmaması.
// İstekler backend'den geçtiği için tüm kullanıcılar Nominatim'e tek istemci gibi görünür; sınır burada uygulanır.
const MIN_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 200;

const cache = new Map<string, { at: number; places: Place[] }>();
let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

// İstekler sıraya alınır; bir önceki istekten 1 saniye geçmeden yenisi gönderilmez.
function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => undefined); // bir isteğin hatası sıradakileri durdurmasın
  return run;
}

const district = (a: Record<string, string> = {}) =>
  a.city_district ?? a.town ?? a.county ?? a.suburb ?? a.city;

function toPlace(item: NominatimItem): Place | null {
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !item.display_name) return null;

  const base = item.name || item.display_name.split(',')[0].trim();
  const area = district(item.address);
  return {
    name: area && area !== base ? `${base} (${area})` : base,
    displayName: item.display_name,
    latitude,
    longitude,
  };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const key = query.trim().toLocaleLowerCase('tr');
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.places;

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    'accept-language': 'tr',
    countrycodes: config.geocodingCountryCodes,
  });

  const items = await throttled(async () => {
    let response: Response;
    try {
      response = await fetch(`${config.nominatimUrl}/search?${params}`, {
        headers: { 'User-Agent': config.nominatimUserAgent },
        signal: AbortSignal.timeout(config.osrmTimeoutMs),
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new HttpError(504, 'GEOCODING_TIMEOUT', 'Adres servisi zamanında yanıt vermedi. Lütfen tekrar deneyin.');
      }
      throw new HttpError(502, 'GEOCODING_UNAVAILABLE', 'Adres servisine şu anda ulaşılamıyor.');
    }
    if (response.status === 429) {
      throw new HttpError(503, 'GEOCODING_BUSY', 'Adres servisi şu anda yoğun. Birkaç saniye sonra tekrar deneyin.');
    }
    try {
      const data: unknown = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error('beklenmeyen cevap');
      return data as NominatimItem[];
    } catch {
      throw new HttpError(502, 'GEOCODING_BAD_RESPONSE', 'Adres servisinden geçersiz cevap alındı.');
    }
  });

  // Aynı yer OpenStreetMap'te hem nokta hem alan olarak kayıtlı olabilir ve iki kez döner.
  // Aynı adlı ve ~200 m içindeki sonuçlar tekrar sayılır; listede bir kez gösterilir.
  const places: Place[] = [];
  for (const place of items.map(toPlace)) {
    const duplicate = places.some(
      (p) =>
        p.name === place?.name &&
        Math.abs(p.latitude - place.latitude) < 0.002 &&
        Math.abs(p.longitude - place.longitude) < 0.002,
    );
    if (place && !duplicate) places.push(place);
  }

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), places });
  return places;
}
