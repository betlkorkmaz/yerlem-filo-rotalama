import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/httpError';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'İstenen uç bulunamadı.' } });
};

// Tüm hatalar tek biçimde döner: { error: { code, message, details? } }.
// Frontend her cevabı aynı şekilde yorumlayabilsin diye bu sözleşme sabit tutulur.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Gönderilen veri geçersiz.',
        // Alan bazlı mesajlar; frontend bunları ilgili form alanının altında gösterir.
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  // Bozuk JSON gövdesi gibi istemci kaynaklı ayrıştırma hataları.
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'İstek gövdesi geçerli JSON değil.' } });
    return;
  }

  // Beklenmeyen hatanın ayrıntısı loglanır ama istemciye sızdırılmaz.
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Beklenmeyen bir sunucu hatası oluştu.' } });
};
