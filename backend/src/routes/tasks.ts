import { Router } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { createTask, listTasks, updateTask, deleteTask } from '../services/taskService';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const createTaskSchema = z.object({ body: z.object({ title: z.string().min(1).max(200), description: z.string().max(2000).optional(), dueAt: z.string().datetime().optional() }) });
const patchTaskSchema = z.object({ body: z.object({ title: z.string().min(1).max(200).optional(), description: z.string().max(2000).nullable().optional(), dueAt: z.string().datetime().nullable().optional(), completedAt: z.string().datetime().nullable().optional() }) });

export const router = Router();

router.use(auth);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    res.json(await listTasks(req.userId!));
  } catch (e) { next(e); }
});

router.post('/', validate(createTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const { title, description, dueAt } = req.body;
    const task = await createTask(req.userId!, { title, description, dueAt, source: 'user' });
    res.status(201).json(task);
  } catch (e) { next(e); }
});

router.patch('/:id', validate(patchTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const updated = await updateTask(req.userId!, req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const ok = await deleteTask(req.userId!, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});
