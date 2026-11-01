import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

const ai = new Anthropic();

tasksRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query as { status?: string };
  let query = 'SELECT id, title, description, status, priority, ai_priority_reason, created_at FROM tasks WHERE user_id = $1';
  const params: unknown[] = [req.userId];
  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }
  query += ' ORDER BY CASE priority WHEN \'critical\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 ELSE 4 END, created_at ASC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

tasksRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description = '', status = 'todo', priority = 'medium' } = req.body as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
  };
  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const { rows } = await pool.query(
    `INSERT INTO tasks (user_id, title, description, status, priority)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, description, status, priority, ai_priority_reason, created_at`,
    [req.userId, title, description, status, priority],
  );
  res.status(201).json(rows[0]);
});

tasksRouter.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, status, priority } = req.body as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
  };
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
  if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
  if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }
  if (priority !== undefined) { fields.push(`priority = $${idx++}`); values.push(priority); }
  if (!fields.length) { res.status(400).json({ error: 'No fields to update' }); return; }
  fields.push(`updated_at = NOW()`);
  values.push(req.params.id, req.userId);
  const { rows } = await pool.query(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
    values,
  );
  if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

tasksRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!rowCount) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).end();
});

tasksRouter.post('/ai-prioritize', async (req: AuthRequest, res: Response): Promise<void> => {
  const { rows } = await pool.query(
    `SELECT id, title, description, status, priority FROM tasks WHERE user_id = $1 AND status != 'done' ORDER BY created_at ASC`,
    [req.userId],
  );
  if (!rows.length) { res.json({ updated: 0 }); return; }

  const taskList = rows.map((t: { title: string; description: string }, i: number) =>
    `${i + 1}. "${t.title}" — ${t.description || '(no description)'}`
  ).join('\n');

  const message = await ai.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a software engineering team lead. Prioritize these open tasks by urgency and importance. Return ONLY valid JSON — an array of objects with: id (number, 1-based), priority ("low"|"medium"|"high"|"critical"), reason (one sentence max).\n\nTasks:\n${taskList}`,
      },
    ],
  });

  const text = (message.content[0] as { text: string }).text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) { res.status(500).json({ error: 'AI returned unexpected format' }); return; }

  const priorities = JSON.parse(jsonMatch[0]) as Array<{ id: number; priority: string; reason: string }>;

  let updated = 0;
  for (const p of priorities) {
    const task = rows[p.id - 1] as { id: string } | undefined;
    if (!task) continue;
    await pool.query(
      'UPDATE tasks SET priority = $1, ai_priority_reason = $2, updated_at = NOW() WHERE id = $3',
      [p.priority, p.reason, task.id],
    );
    updated++;
  }
  res.json({ updated });
});
