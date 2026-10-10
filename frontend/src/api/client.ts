// Tüm HTTP çağrıları buradan geçer. Ağ kopması, zaman aşımı, boş/bozuk cevap ve 4xx/5xx
// gibi farklı hatalar tek bir ApiError tipine çevrilir; ekranlar sadece bu tipi tanır.

const DEFAULT_TIMEOUT_MS = 15_000;

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors: FieldErrors = {},
    // Backend'in ham ek bilgisi (ör. rota servisinin hangi durakta sorun bulduğu: { stopIndex }).
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

const fallbackMessages: Record<number, string> = {
  400: 'Gönderilen bilgiler geçersiz.',
  404: 'İstenen kayıt bulunamadı.',
  409: 'İşlem mevcut verilerle çakışıyor.',
  500: 'Sunucuda beklenmeyen bir hata oluştu.',
  502: 'Bağlı servis hatalı yanıt verdi.',
  503: 'Servis şu anda kullanılamıyor.',
  504: 'Bağlı servis zamanında yanıt vermedi.',
};

// Backend iki biçimde alan hatası döner: doğrulamada [{ field, message }] listesi,
// iş kuralında ise { field } (ör. plaka alınmış). İkisi de { alan: mesaj } haline getirilir.
function toFieldErrors(error: ErrorBody['error']): FieldErrors {
  const details = error?.details;
  if (Array.isArray(details)) {
    return Object.fromEntries(
      details
        .filter((d): d is { field: string; message: string } => typeof d?.field === 'string' && d.field !== '')
        .map((d) => [d.field, d.message]),
    );
  }
  if (details && typeof details === 'object' && 'field' in details && error?.message) {
    return { [String(details.field)]: error.message };
  }
  return {};
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
    });
  } catch (err) {
    // Çağıran isteği kendisi iptal ettiyse (ör. sayfadan çıkıldı) hata olarak gösterilmez.
    if (signal?.aborted) throw err;
    if (timeoutSignal.aborted) {
      throw new ApiError(0, 'TIMEOUT', 'Sunucu zamanında yanıt vermedi. Lütfen tekrar deneyin.');
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.');
  }

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const error = (data as ErrorBody | undefined)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? `HTTP_${response.status}`,
      error?.message ?? fallbackMessages[response.status] ?? 'İşlem tamamlanamadı.',
      toFieldErrors(error),
      error?.details,
    );
  }

  if (data === undefined) {
    throw new ApiError(response.status, 'EMPTY_RESPONSE', 'Sunucudan beklenen cevap alınamadı.');
  }
  return data as T;
}
