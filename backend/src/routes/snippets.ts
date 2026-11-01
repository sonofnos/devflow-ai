import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const snippetsRouter = Router();
snippetsRouter.use(requireAuth);

const ai = new Anthropic();

snippetsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { tag } = req.query as { tag?: string };
  let query = 'SELECT id, title, language, code, tags, ai_explanation, created_at FROM snippets WHERE user_id = $1';
  const params: unknown[] = [req.userId];
  if (tag) {
    query += ' AND $2 = ANY(tags)';
    params.push(tag);
  }
  query += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

snippetsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, language = 'javascript', code, tags = [] } = req.body as {
    title?: string;
    language?: string;
    code?: string;
    tags?: string[];
  };
  if (!title || !code) {
    res.status(400).json({ error: 'title and code are required' });
    return;
  }
  const { rows } = await pool.query(
    `INSERT INTO snippets (user_id, title, language, code, tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, language, code, tags, ai_explanation, created_at`,
    [req.userId, title, language, code, tags],
  );
  res.status(201).json(rows[0]);
});

snippetsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { rows } = await pool.query(
    'SELECT * FROM snippets WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId],
  );
  if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

snippetsRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { rowCount } = await pool.query(
    'DELETE FROM snippets WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId],
  );
  if (!rowCount) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).end();
});

snippetsRouter.post('/:id/explain', async (req: AuthRequest, res: Response): Promise<void> => {
  const { rows } = await pool.query(
    'SELECT * FROM snippets WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId],
  );
  if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }

  const snippet = rows[0] as { id: string; language: string; code: string };

  const message = await ai.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Explain this ${snippet.language} code snippet in 3-5 concise bullet points. Focus on what it does, any notable patterns or gotchas, and when you'd use it. Keep it practical.\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``,
      },
    ],
  });

  const explanation = (message.content[0] as { text: string }).text;
  await pool.query('UPDATE snippets SET ai_explanation = $1, updated_at = NOW() WHERE id = $2', [explanation, snippet.id]);
  res.json({ explanation });
});
