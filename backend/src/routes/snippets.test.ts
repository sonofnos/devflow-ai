import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index';

jest.mock('../db/pool', () => ({ pool: { query: jest.fn() } }));
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: class {
    messages = {
      create: jest.fn().mockResolvedValue({
        content: [{ text: '• Does X\n• Pattern: Y\n• Use when Z' }],
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

describe('GET /api/snippets', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/snippets');
    expect(res.status).toBe(401);
  });

  it('returns snippet list', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's-1', title: 'debounce', language: 'typescript', tags: [] }] });
    const res = await request(app).get('/api/snippets').set(auth);
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('debounce');
  });
});

describe('POST /api/snippets', () => {
  it('returns 400 when title missing', async () => {
    const res = await request(app).post('/api/snippets').set(auth).send({ code: 'const x = 1' });
    expect(res.status).toBe(400);
  });

  it('creates a snippet', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's-2', title: 'useDebounce', language: 'typescript', code: 'const x = 1', tags: ['react'], ai_explanation: null, created_at: new Date() }] });
    const res = await request(app).post('/api/snippets').set(auth).send({ title: 'useDebounce', language: 'typescript', code: 'const x = 1', tags: ['react'] });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('useDebounce');
  });
});

describe('POST /api/snippets/:id/explain', () => {
  it('returns AI explanation', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 's-1', language: 'typescript', code: 'const x = 1' }] }) // fetch snippet
      .mockResolvedValueOnce({ rows: [] }); // update explanation
    const res = await request(app).post('/api/snippets/s-1/explain').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.explanation).toContain('•');
  });

  it('returns 404 for unknown snippet', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/snippets/no-exist/explain').set(auth);
    expect(res.status).toBe(404);
  });
});
