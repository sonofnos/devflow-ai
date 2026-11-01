import request from 'supertest';
import { app } from '../index';

// Mock pg pool — tests run without a real DB
jest.mock('../db/pool', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { pool } from '../db/pool';
const mockQuery = pool.query as jest.Mock;

const JWT_SECRET = 'test-secret-32-chars-long-enough!';
process.env.JWT_SECRET = JWT_SECRET;
process.env.DATABASE_URL = 'postgres://test';

afterEach(() => jest.clearAllMocks());

describe('POST /api/auth/register', () => {
  it('returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password too short', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'abc', name: 'Alice' });
    expect(res.status).toBe(400);
  });

  it('registers and returns token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'uuid-1', email: 'alice@test.com', name: 'Alice' }] });
    const res = await request(app).post('/api/auth/register').send({ email: 'alice@test.com', password: 'password123', name: 'Alice' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@test.com');
  });

  it('returns 409 on duplicate email', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23505' });
    const res = await request(app).post('/api/auth/register').send({ email: 'alice@test.com', password: 'password123', name: 'Alice' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong password', async () => {
    // bcrypt hash of "otherpassword"
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'uuid-1', email: 'alice@test.com', name: 'Alice', password_hash: '$2a$12$invalid' }] });
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});
