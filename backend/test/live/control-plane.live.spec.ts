/**
 * Integration tests gọi API thật (backend đã chạy + Postgres + Redis).
 * Không khởi tạo Nest trong Jest → tránh xung đột ESM của better-auth.
 *
 * Chuẩn bị:
 *   docker compose -f docker-compose.deps.yml up -d
 *   cd backend && npx prisma migrate deploy && npx prisma db seed
 *   npm run dev   (hoặc start:prod sau build)
 *
 * Optional: TEST_API_URL=http://127.0.0.1:3001 npm run test:e2e
 */
import request from 'supertest';

const baseUrl = () => process.env.TEST_API_URL ?? 'http://127.0.0.1:3001';
const api = () => request(baseUrl());

/** Must match BETTER_AUTH `trustedOrigins` (normally FRONTEND_URL). Required for POST /api/auth/* (CSRF). */
const authOrigin = () => process.env.TEST_AUTH_ORIGIN ?? 'http://localhost:3000';

/** Supertest exposes full Set-Cookie; request header must only be `name=value` (never Path=/ Max-Age=...). */
function cookiePairFromSetCookie(raw: string | string[] | undefined): string {
  const line = Array.isArray(raw) ? raw[0] : raw;
  if (!line) return '';
  return line.split(';')[0]!.trim();
}

async function waitForProjectStatus(
  cookie: string,
  projectId: string,
  want: string | string[],
  timeoutMs = 30_000,
) {
  const ok = Array.isArray(want) ? want : [want];
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await api().get(`/api/projects/${projectId}/health`).set('Cookie', cookie);
    const st = res.body?.data?.status;
    if (res.status === 200 && st && ok.includes(st)) return;
    if (Date.now() > deadline) {
      throw new Error(
        `Timeout waiting project ${projectId} status ${ok.join('|')}, got HTTP ${res.status} ${st}`,
      );
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

const pwd = 'ValidPassword123!';

describe('Control plane LIVE (Docker + running API)', () => {
  beforeAll(async () => {
    try {
      const res = await api().get('/health').timeout(5000);
      if (res.status !== 200 || !res.body?.success) {
        throw new Error(`GET /health trả ${res.status}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(
        `Không kết nối được API tại ${baseUrl()} (${msg}). Đặt TEST_API_URL nếu cần. Chạy: npm run docker:deps → prisma migrate deploy + seed → npm run dev, rồi npm run test:e2e.`,
      );
    }
  });

  describe('App', () => {
    it('GET /health', async () => {
      const res = await api().get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ status: 'ok', uptime: expect.any(Number) });
    });

    it('GET /', async () => {
      const res = await api().get('/');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Auth session', () => {
    const email = `live-auth-${Date.now()}@example.com`;
    let cookie: string;

    it('sign-up', async () => {
      const res = await api()
        .post('/api/auth/sign-up/email')
        .set('Origin', authOrigin())
        .send({ email, password: pwd, name: 'Live Auth' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(email);
      expect(res.headers['set-cookie']).toBeDefined();
      cookie = cookiePairFromSetCookie(res.headers['set-cookie']);
    });

    it('get-session', async () => {
      const res = await api().get('/api/auth/get-session').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(email);
    });

    it('sign-in', async () => {
      const res = await api()
        .post('/api/auth/sign-in/email')
        .set('Origin', authOrigin())
        .send({ email, password: pwd })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('sign-out invalidates cookie', async () => {
      const reSign = await api()
        .post('/api/auth/sign-in/email')
        .set('Origin', authOrigin())
        .send({ email, password: pwd })
        .set('Accept', 'application/json');
      const ck = cookiePairFromSetCookie(reSign.headers['set-cookie']);
      await api()
        .post('/api/auth/sign-out')
        .set('Origin', authOrigin())
        .set('Cookie', ck)
        .expect(200);
      const after = await api().get('/api/auth/get-session').set('Cookie', ck);
      expect(after.status).toBe(200);
      expect(after.body).toBeNull();
    });
  });

  describe('Projects + billing + secrets', () => {
    const email = `live-main-${Date.now()}@example.com`;
    let cookie: string;
    let userId: string;
    let projectId: string;

    beforeAll(async () => {
      const reg = await api()
        .post('/api/auth/sign-up/email')
        .set('Origin', authOrigin())
        .send({ email, password: pwd, name: 'Live Main' })
        .set('Accept', 'application/json');
      expect(reg.status).toBe(200);
      userId = reg.body.user.id;
      cookie = cookiePairFromSetCookie(reg.headers['set-cookie']);
    });

    it('POST /api/projects', async () => {
      const res = await api()
        .post('/api/projects')
        .set('Cookie', cookie)
        .send({ displayName: 'Live Project' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        userId,
        displayName: 'Live Project',
        status: expect.any(String),
      });
      projectId = res.body.data.id;
    });

    it('GET /api/projects/mine', async () => {
      const res = await api().get('/api/projects/mine').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('PATCH displayName', async () => {
      const res = await api()
        .patch(`/api/projects/${projectId}`)
        .set('Cookie', cookie)
        .send({ displayName: 'Renamed Live' });
      expect(res.status).toBe(200);
      expect(res.body.data.displayName).toBe('Renamed Live');
    });

    it('gateway token', async () => {
      const res = await api().get(`/api/projects/${projectId}/gateway-token`).set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(typeof res.body.data.token).toBe('string');
      expect(res.body.data.token.length).toBeGreaterThan(16);
    });

    it('encrypted env PUT/GET/DELETE', async () => {
      const put = await api()
        .put(`/api/projects/${projectId}/env`)
        .set('Cookie', cookie)
        .send({
          env: [{ key: 'OPENROUTER_API_KEY', value: 'sk-test-placeholder-not-real' }],
        });
      expect(put.status).toBe(200);
      const list = await api().get(`/api/projects/${projectId}/env`).set('Cookie', cookie);
      expect(list.status).toBe(200);
      const row = list.body.data.find((r: any) => r.key === 'OPENROUTER_API_KEY');
      expect(row).toBeTruthy();
      expect(row.masked).not.toContain('sk-test-placeholder');

      const del = await api()
        .delete(`/api/projects/${projectId}/env`)
        .set('Cookie', cookie)
        .send({ key: 'OPENROUTER_API_KEY' });
      expect(del.status).toBe(200);
    });

    it('Credits wallet + history + cost', async () => {
      const wallet = await api().get('/api/credits/wallet').set('Cookie', cookie);
      expect(wallet.status).toBe(200);
      expect(wallet.body.data.monthlyBalance).toBeDefined();
      const hist = await api().get('/api/credits/history?take=5').set('Cookie', cookie);
      expect(hist.status).toBe(200);
      expect(Array.isArray(hist.body.data)).toBe(true);
      const cost = await api().get('/api/credits/cost/PLAYWRIGHT').set('Cookie', cookie);
      expect(cost.status).toBe(200);
      expect(cost.body.data.credits).toBe(1);
    });

    it('plan limit: cannot create second project on free tier', async () => {
      const res = await api()
        .post('/api/projects')
        .set('Cookie', cookie)
        .send({ displayName: 'Second' });
      expect(res.status).toBe(409);
    });

    it('heavy job forbidden on free plan', async () => {
      const res = await api()
        .post('/api/heavy/submit')
        .set('Cookie', cookie)
        .send({ projectId, tool: 'PLAYWRIGHT', params: {} });
      expect(res.status).toBe(403);
    });

    it('start / stop cycle', async () => {
      await waitForProjectStatus(cookie, projectId, 'RUNNING');
      const stopRes = await api().post(`/api/projects/${projectId}/stop`).set('Cookie', cookie).send({});
      expect(stopRes.status).toBe(200);
      expect(stopRes.body.data.status).toBe('STOPPING');
      const startRes = await api().post(`/api/projects/${projectId}/start`).set('Cookie', cookie).send({});
      expect(startRes.status).toBe(200);
      expect(['STARTING', 'RUNNING', 'CREATING']).toContain(startRes.body.data.status);
    });

    it('delete project after stop', async () => {
      await waitForProjectStatus(cookie, projectId, 'RUNNING');
      await api().post(`/api/projects/${projectId}/stop`).set('Cookie', cookie).send({});
      const del = await api().delete(`/api/projects/${projectId}`).set('Cookie', cookie);
      expect(del.status).toBe(200);
      await api().get(`/api/projects/${projectId}/health`).set('Cookie', cookie).expect(404);
    });
  });

  describe('Cross-user isolation', () => {
    it('cannot read another user health', async () => {
      const aEmail = `live-a-${Date.now()}@example.com`;
      const bEmail = `live-b-${Date.now()}@example.com`;

      const aReg = await api()
        .post('/api/auth/sign-up/email')
        .set('Origin', authOrigin())
        .send({ email: aEmail, password: pwd, name: 'A' })
        .set('Accept', 'application/json');
      const bReg = await api()
        .post('/api/auth/sign-up/email')
        .set('Origin', authOrigin())
        .send({ email: bEmail, password: pwd, name: 'B' })
        .set('Accept', 'application/json');

      const aCookie = cookiePairFromSetCookie(aReg.headers['set-cookie']);
      const bCookie = cookiePairFromSetCookie(bReg.headers['set-cookie']);

      const proj = await api()
        .post('/api/projects')
        .set('Cookie', aCookie)
        .send({ displayName: 'A Proj' });
      const pid = proj.body.data.id;

      await waitForProjectStatus(aCookie, pid, 'RUNNING');

      const leaked = await api().get(`/api/projects/${pid}/health`).set('Cookie', bCookie);
      expect([403, 404]).toContain(leaked.status);

      await api().post(`/api/projects/${pid}/stop`).set('Cookie', aCookie).send({});
      await api().delete(`/api/projects/${pid}`).set('Cookie', aCookie);
    });
  });
});
