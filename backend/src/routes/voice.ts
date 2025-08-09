import { Router } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { voiceFeatureEnabled, transcribeAudio } from '../services/voiceService';
import { futureSelfResponse } from '../services/aiService';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import multer from 'multer';

const futureSchema = z.object({ body: z.object({ message: z.string().min(3).max(500) }) });
const transcribeSchema = z.object({ body: z.object({ text: z.string().min(1).max(500) }) });

// Configure multer for audio file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

export const router = Router();
router.use(auth);

router.get('/enabled', (_req: AuthRequest, res) => {
  res.json({ enabled: voiceFeatureEnabled() });
});

// Keep a semantic alias so existing client call can be repointed if needed
router.post('/future-self', validate(futureSchema), async (req: AuthRequest, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const reply = await futureSelfResponse(message);
    res.json({ reply });
  } catch (e) { next(e); }
});
// Audio transcription endpoint: accepts audio file and returns transcribed text
router.post('/transcribe', upload.single('audio'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required' });
    }
    
    const transcription = await transcribeAudio(req.file.buffer, req.file.originalname);
    res.json({ transcription });
  } catch (e) { 
    console.error('Transcription error:', e);
    next(e); 
  }
});

// Text-only voice endpoint: client supplies transcribed speech text; we return structured reply
router.post('/transcribe-and-reply', validate(transcribeSchema), async (req: AuthRequest, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const reply = await futureSelfResponse(text);
    res.json({ reply });
  } catch (e) { next(e); }
});

// Combined endpoint: accepts audio file, transcribes it, and returns AI response
router.post('/transcribe-and-process', upload.single('audio'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required' });
    }
    
    const transcription = await transcribeAudio(req.file.buffer, req.file.originalname);
    const reply = await futureSelfResponse(transcription);
    
    res.json({ transcription, reply });
  } catch (e) { 
    console.error('Transcribe and process error:', e);
    next(e); 
  }
});
