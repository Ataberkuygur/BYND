import { Router } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { scheduleTaskAsEvent, listEvents, deleteEvent } from '../services/calendarService';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const scheduleSchema = z.object({ body: z.object({ title: z.string().min(1).max(200), start: z.string().datetime(), end: z.string().datetime().optional(), description: z.string().max(2000).optional() }) });

export const router = Router();
router.use(auth);

router.post('/schedule', validate(scheduleSchema), async (req: AuthRequest, res, next) => {
  try {
    const { title, start, end, description } = req.body;
    if (!title || !start) return res.status(400).json({ error: 'title & start required' });
    const evt = await scheduleTaskAsEvent(req.userId!, { title, start, end, description });
    res.json(evt);
  } catch (e) { next(e); }
});

router.get('/events', async (req: AuthRequest, res, next) => {
  try {
    const events = await listEvents(req.userId!);
    res.json(events);
  } catch (e) { next(e); }
});

router.delete('/events/:id', async (req: AuthRequest, res, next) => {
  try {
    const success = await deleteEvent(req.userId!, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(204).end();
  } catch (e) { next(e); }
});
