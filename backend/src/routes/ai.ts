import { Router } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { interpretUserUtterance, futureSelfResponse } from '../services/aiService';
import { createTask } from '../services/taskService';
import { getChatHistory, saveChatMessage, clearChatHistory } from '../services/chatService';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const interpretSchema = z.object({ body: z.object({ utterance: z.string().min(3).max(500) }) });
const futureSelfSchema = z.object({ body: z.object({ message: z.string().min(3).max(500) }) });
const chatSchema = z.object({ body: z.object({ message: z.string().min(1).max(1000) }) });

export const router = Router();
router.use(auth);

router.post('/interpret', validate(interpretSchema), async (req: AuthRequest, res, next) => {
  try {
    const { utterance } = req.body;
    if (!utterance) return res.status(400).json({ error: 'utterance required' });
    const tasks = await interpretUserUtterance(utterance);
  const createdPromises = tasks.map(t => createTask(req.userId!, { title: t.title, description: t.description, dueAt: t.dueAt, source: 'voice' }));
  const created = await Promise.all(createdPromises);
  res.json(created);
  } catch (e) { next(e); }
});

router.post('/future-self', validate(futureSelfSchema), async (req: AuthRequest, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const reply = await futureSelfResponse(message);
    res.json({ reply });
  } catch (e) { next(e); }
});

// Chat endpoints for the chat interface
router.get('/chat/history', async (req: AuthRequest, res, next) => {
  try {
    const messages = await getChatHistory(req.userId!);
    res.json(messages);
  } catch (e) { next(e); }
});

router.post('/chat', validate(chatSchema), async (req: AuthRequest, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    
    // Save user message
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user' as const,
      timestamp: new Date().toISOString()
    };
    await saveChatMessage(req.userId!, userMessage);
    
    // Get AI response
    const reply = await futureSelfResponse(message);
    
    // Save AI response
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      text: reply,
      sender: 'ai' as const,
      timestamp: new Date().toISOString()
    };
    await saveChatMessage(req.userId!, aiMessage);
    
    // Return AI response
    res.json(aiMessage);
  } catch (e) { next(e); }
});

router.delete('/chat/clear', async (req: AuthRequest, res, next) => {
  try {
    await clearChatHistory(req.userId!);
    res.json({ success: true });
  } catch (e) { next(e); }
});
