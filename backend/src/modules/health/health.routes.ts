import { Router } from 'express';
import { db } from '../../db/knex';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await db.raw('select 1');
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'down' });
  }
});
