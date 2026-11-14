import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SUBMISSIONS_DIR = path.join(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(SUBMISSIONS_DIR, 'contact-submissions.json');

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface StoredSubmission extends ContactPayload {
  id: string;
  submittedAt: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactPayload(body: unknown): {
  valid: boolean;
  data?: ContactPayload;
  errors?: Record<string, string>;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: { form: 'Invalid request payload.' } };
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const email = typeof raw.email === 'string' ? raw.email.trim() : '';
  const subject = typeof raw.subject === 'string' ? raw.subject.trim() : '';
  const message = typeof raw.message === 'string' ? raw.message.trim() : '';

  const errors: Record<string, string> = {};

  if (name.length < 2 || name.length > 100) {
    errors.name = 'Please enter your name (2–100 characters).';
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    errors.email = 'Please enter a valid email address.';
  }
  if (subject.length < 3 || subject.length > 150) {
    errors.subject = 'Please enter a subject (3–150 characters).';
  }
  if (message.length < 10 || message.length > 2500) {
    errors.message = 'Please enter a message (10–2500 characters).';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: { name, email, subject, message },
  };
}

async function persistSubmission(payload: ContactPayload): Promise<StoredSubmission> {
  await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });

  let existing: StoredSubmission[] = [];
  try {
    const content = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      existing = parsed;
    }
  } catch {
    existing = [];
  }

  const record: StoredSubmission = {
    id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    ...payload,
    submittedAt: new Date().toISOString(),
  };

  existing.push(record);
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(existing, null, 2), 'utf8');

  return record;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/contact', async (req: Request, res: Response) => {
    const validation = validateContactPayload(req.body);

    if (!validation.valid || !validation.data) {
      res.status(400).json({
        ok: false,
        message: 'Please correct the highlighted fields and try again.',
        errors: validation.errors,
      });
      return;
    }

    try {
      const saved = await persistSubmission(validation.data);
      res.status(201).json({
        ok: true,
        id: saved.id,
        submittedAt: saved.submittedAt,
        message: 'Thank you for reaching out. Your message has been recorded.',
      });
    } catch (error) {
      console.error('Failed to persist contact submission:', error);
      res.status(500).json({
        ok: false,
        message: 'Unable to save your message right now. Please email directly.',
      });
    }
  });

  const publicDir = path.join(__dirname, 'public');
  app.get('/Rakesh_Roshan_Resume.pdf', (_req: Request, res: Response) => {
    res.type('application/pdf');
    res.sendFile(path.join(publicDir, 'Rakesh_Roshan_Resume.pdf'));
  });

  if (!IS_PRODUCTION) {
    app.use(express.static(publicDir));
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
