import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index';

jest.mock('../db/pool', () => ({ pool: { query: jest.fn() } }));
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: class {
    messages = {
      create: jest.fn().mockResolvedValue({
        content: [{ text: '[{"id":1,"priority":"high","reason":"Blocking other work"},{"id":2,"priority":"medium","reason":"Nice to have"}]' }],
      }),
    };
  },
}));

import { pool } from '../db/pool';
const mockQuery = pool.query as jest.Mock;

const SECRET = 'test-secret-32-chars-long-enough!';
process.env.JWT_SECRET = SECRET;
process.env.DATABASE_URL = 'postgres://test';

const token = jwt.sign({ sub: 'user-1' }, SECRET, { expiresIn: '1h' });
const auth = { Authorization: `Bearer ${token}` };

afterEach(() => jest.clearAllMocks());

describe('GET /api/tasks', () => {
  it('returns 401 without token', async () => {
    expect((await request(app).get('/api/tasks')).status).toBe(401);
  });

  it('returns task list', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 't-1', title: 'Fix bug', status: 'todo', priority: 'high' }] });
    const res = await request(app).get('/api/tasks').set(auth);
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Fix bug');
  });
});

describe('POST /api/tasks', () => {
  it('returns 400 when title missing', async () => {
    const res = await request(app).post('/api/tasks').set(auth).send({ description: 'do stuff' });
    expect(res.status).toBe(400);
  });

  it('creates a task', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 't-2', title: 'Write tests', description: '', status: 'todo', priority: 'medium', ai_priority_reason: null, created_at: new Date() }] });
    const res = await request(app).post('/api/tasks').set(auth).send({ title: 'Write tests' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Write tests');
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('returns 400 with no body', async () => {
    const res = await request(app).patch('/api/tasks/t-1').set(auth).send({});
    expect(res.status).toBe(400);
  });

  it('updates status', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 't-1', status: 'in_progress', priority: 'high' }] });
    const res = await request(app).patch('/api/tasks/t-1').set(auth).send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });
});

describe('POST /api/tasks/ai-prioritize', () => {
  it('returns updated count', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 't-1', title: 'Fix login bug', description: 'Auth fails' }, { id: 't-2', title: 'Add dark mode', description: 'Nice UI' }] })
      .mockResolvedValueOnce({ rows: [] }) // update t-1
      .mockResolvedValueOnce({ rows: [] }); // update t-2
    const res = await request(app).post('/api/tasks/ai-prioritize').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(2);
  });

  it('returns 0 when no open tasks', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/tasks/ai-prioritize').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(0);
  });
});
