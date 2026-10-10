import { Router } from 'express';
import { z } from 'zod';
import { searchPlaces } from './nominatim.service';

const searchQuerySchema = z.object({
  q: z
    .string({ error: 'Aranacak adresi yazın.' })
    .trim()
    .min(3, { error: 'En az 3 karakter yazın.' })
    .max(100, { error: 'Arama en fazla 100 karakter olabilir.' }),
});

export const geocodingRouter = Router();

// Adres → koordinat. Kullanıcının enlem/boylam bilmesi gerekmesin diye; sonuç bulunamazsa boş liste döner.
geocodingRouter.get('/search', async (req, res) => {
  const { q } = searchQuerySchema.parse(req.query);
  res.json(await searchPlaces(q));
});
