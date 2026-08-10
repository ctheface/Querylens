import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', appDb: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', appDb: 'down', message: err.message });
  }
});

export default router;
