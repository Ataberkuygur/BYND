import request from 'supertest';
import { app } from '../src/app';

const EMAIL = 'test@example.com';
const PASSWORD = 'TestPass123!';

describe('Auth + Tasks flow (memory)', () => {
  let accessToken: string;
  let refreshToken: string;
  it('registers user', async () => {
    const res = await request(app).post('/auth/register').send({ email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(201);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
    expect(accessToken).toBeTruthy();
  });
  it('refreshes token', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });
  it('creates task', async () => {
    const res = await request(app).post('/tasks').set('Authorization', 'Bearer ' + accessToken).send({ title: 'Sample Task' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Sample Task');
  });
  it('lists tasks', async () => {
    const res = await request(app).get('/tasks').set('Authorization', 'Bearer ' + accessToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
