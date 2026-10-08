// İş kurallarından fırlatılan, HTTP durum koduna doğrudan karşılık gelen hata.
// Servis katmanı Express'i bilmez; sadece bu hatayı fırlatır, cevaba çevirmek errorHandler'ın işidir.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
