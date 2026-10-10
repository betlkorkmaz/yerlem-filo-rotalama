import { ApiError, apiRequest } from './client';

export interface Place {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const data = await apiRequest<unknown>(`/geocoding/search?q=${encodeURIComponent(query)}`, { timeoutMs: 12_000 });
  if (!Array.isArray(data)) throw new ApiError(200, 'INVALID_RESPONSE', 'Adres sonuçları beklenen biçimde gelmedi.');
  return data as Place[];
}
