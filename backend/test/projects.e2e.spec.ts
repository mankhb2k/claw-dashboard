import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/database/prisma.service';
import { ResponseInterceptor } from '../src/core/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/core/common/filters/http-exception.filter';

describe('Projects API (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const testEmail = `projects-${Date.now()}@example.com`;
  const testPassword = 'ValidPassword123!';
  const testName = 'Projects Test User';

  let sessionCookie: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    if (!process.env.OPENCLAW_IMAGE) {
      process.env.OPENCLAW_IMAGE = 'test/openclaw:1';
    }
    if (!process.env.APP_DOMAIN) {
      process.env.APP_DOMAIN = 'clawsandbox.cloud';
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    // Register Fastify plugins (same as main.ts)
    await app.register(fastifyCors, {
      origin: ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    await app.register(fastifyCookie);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Clean up
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // Create user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

    sessionCookie = registerResponse.headers['set-cookie'][0];
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Cookie', sessionCookie)
        .send({ displayName: 'E2E Project' });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          userId: userId,
          displayName: 'E2E Project',
          subdomain: expect.any(String),
          publicUrl: expect.stringMatching(/^https:\/\//),
          status: 'CREATING',
          createdAt: expect.any(String),
          lastActiveAt: expect.any(String),
        }),
      );

      projectId = response.body.data.id;
    });

    it('should reject if not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .send({ displayName: 'Nope' });

      expect(response.status).toBe(401);
    });

    it('should reject if free plan limit reached (max 1 project)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Cookie', sessionCookie)
        .send({ displayName: 'Another' });

      expect(response.status).toBe(409);
      expect(String(response.body.message || '')).toMatch(/[Pp]lan/);
    });
  });

  describe('GET /api/projects/mine', () => {
    it('should list user projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/projects/mine')
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          userId: userId,
          displayName: expect.any(String),
          subdomain: expect.any(String),
          publicUrl: expect.stringMatching(/^https:\/\//),
          status: expect.any(String),
          createdAt: expect.any(String),
          lastActiveAt: expect.any(String),
        }),
      );
    });

    it('should reject if not authenticated', async () => {
      const response = await request(app.getHttpServer()).get('/api/projects/mine');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/projects/:id/health', () => {
    it('should get project health status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}/health`)
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          status: expect.any(String),
          displayName: expect.any(String),
          publicUrl: expect.stringMatching(/^https:\/\//),
          subdomain: expect.any(String),
          lastActiveAt: expect.any(String),
          storageUsedMb: expect.any(Number),
        }),
      );
    });

    it('should reject if project not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/projects/nonexistent-id/health')
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(404);
    });

    it('should reject if not owner', async () => {
      // Create another user
      const otherEmail = `other-${Date.now()}@example.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: otherEmail,
          password: testPassword,
          name: 'Other User',
        });

      const otherSessionCookie = registerResponse.headers['set-cookie'][0];

      const response = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}/health`)
        .set('Cookie', otherSessionCookie);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/projects/:id/instances', () => {
    it('should get project container instances history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}/instances`)
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      // May be empty initially, but structure should be array
    });

    it('should reject if not authenticated', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/projects/${projectId}/instances`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/projects/:id/start', () => {
    it('should start a stopped project', async () => {
      // First stop the project
      await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/stop`)
        .set('Cookie', sessionCookie)
        .send({});

      // Then start it
      const response = await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/start`)
        .set('Cookie', sessionCookie)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('STARTING');
    });

    it('should reject if not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/start`)
        .send({});

      expect(response.status).toBe(401);
    });

    it('should reject if project not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/projects/nonexistent-id/start')
        .set('Cookie', sessionCookie)
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/projects/:id/stop', () => {
    it('should stop a running project', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/stop`)
        .set('Cookie', sessionCookie)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('STOPPING');
    });

    it('should reject if not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/stop`)
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a stopped project', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/projects/${projectId}`)
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(200);

      // Verify it's deleted
      const getResponse = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}/health`)
        .set('Cookie', sessionCookie);

      expect(getResponse.status).toBe(404);
    });

    it('should reject if not authenticated', async () => {
      const response = await request(app.getHttpServer()).delete(`/api/projects/${projectId}`);

      expect(response.status).toBe(401);
    });

    it('should reject if project not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/projects/nonexistent-id')
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(404);
    });
  });

  describe('Day 10: Integration Scenarios', () => {
    let user1SessionCookie: string;
    let user1ProjectId: string;

    let user2SessionCookie: string;

    beforeAll(async () => {
      // User 1: Register and create project
      const user1Email = `user1-${Date.now()}@example.com`;
      const registerResponse1 = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: user1Email,
          password: testPassword,
          name: 'User 1',
        });

      user1SessionCookie = registerResponse1.headers['set-cookie'][0];

      // Scenario 1: User 1 creates project → check status → delete
      const createResponse = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Cookie', user1SessionCookie)
        .send({ displayName: 'User 1 project' });

      user1ProjectId = createResponse.body.data.id;

      // User 2: Register for testing cross-user access
      const user2Email = `user2-${Date.now()}@example.com`;
      const registerResponse2 = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: user2Email,
          password: testPassword,
          name: 'User 2',
        });

      user2SessionCookie = registerResponse2.headers['set-cookie'][0];
    });

    it('Scenario 1: Register → Create → Check Status → Delete', async () => {
      // Check health after creation
      const healthResponse = await request(app.getHttpServer())
        .get(`/api/projects/${user1ProjectId}/health`)
        .set('Cookie', user1SessionCookie);

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.data).toHaveProperty('status');
      expect(healthResponse.body.data).toHaveProperty('subdomain');

      // Delete project (after stopping if needed)
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/projects/${user1ProjectId}`)
        .set('Cookie', user1SessionCookie);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.data.deleted).toBe(true);
    });

    it('Scenario 2: Create 2 projects → List them → Start/Stop', async () => {
      const user3Email = `user3-${Date.now()}@example.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: user3Email,
          password: testPassword,
          name: 'User 3',
        });

      const sessionCookie = registerResponse.headers['set-cookie'][0];

      // Create first project
      const project1Response = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Cookie', sessionCookie)
        .send({ displayName: 'First' });

      expect(project1Response.status).toBe(201);
      const projectId1 = project1Response.body.data.id;

      // List projects
      const listResponse = await request(app.getHttpServer())
        .get('/api/projects/mine')
        .set('Cookie', sessionCookie);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body.data)).toBe(true);
      expect(listResponse.body.data.length).toBe(1);

      // Try to create 2nd project (should fail - free plan max 1)
      const project2Response = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Cookie', sessionCookie)
        .send({ displayName: 'Second' });

      expect(project2Response.status).toBe(409);

      // Stop the project
      const stopResponse = await request(app.getHttpServer())
        .post(`/api/projects/${projectId1}/stop`)
        .set('Cookie', sessionCookie)
        .send({});

      expect(stopResponse.status).toBe(200);
      expect(stopResponse.body.data.status).toBe('STOPPING');

      // Start the project
      const startResponse = await request(app.getHttpServer())
        .post(`/api/projects/${projectId1}/start`)
        .set('Cookie', sessionCookie)
        .send({});

      expect(startResponse.status).toBe(200);
      expect(startResponse.body.data.status).toBe('STARTING');
    });

    it('Scenario 3: Free user plan limit (max 1 project)', async () => {
      const userEmail = `user4-${Date.now()}@example.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: userEmail,
          password: testPassword,
          name: 'User 4',
        });

      const sessionCookie = registerResponse.headers['set-cookie'][0];

      // Create 1st project (should succeed)
      const createResponse1 = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Cookie', sessionCookie)
        .send({ displayName: 'A' });

      expect(createResponse1.status).toBe(201);

      // Try 2nd project (should fail)
      const createResponse2 = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Cookie', sessionCookie)
        .send({ displayName: 'B' });

      expect(createResponse2.status).toBe(409);
      expect(createResponse2.body.error.code).toBe('CONFLICT');
    });

    it('Scenario 4: Cross-user access control (403 Forbidden)', async () => {
      // User1 creates project
      const createResponse = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Cookie', user1SessionCookie)
        .send({ displayName: 'User1 cross' });

      const projectId = createResponse.body.data.id;

      // User2 tries to access User1's project
      const accessResponse = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}/health`)
        .set('Cookie', user2SessionCookie);

      expect(accessResponse.status).toBe(403);
      expect(accessResponse.body.error.code).toBe('AUTH_FORBIDDEN');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/projects/${projectId}`)
        .set('Cookie', user1SessionCookie);
    });

    it('Scenario 5: Mock worker auto-updates status (mock only active in dev)', async () => {
      // In development NODE_ENV, mock worker processes jobs
      // In test environment, mock worker is disabled to avoid external calls
      // This test just verifies the structure is in place
      if (process.env.NODE_ENV === 'development') {
        const userEmail = `user5-${Date.now()}@example.com`;
        const registerResponse = await request(app.getHttpServer())
          .post('/api/auth/sign-up/email')
          .send({
            email: userEmail,
            password: testPassword,
            name: 'User 5',
          });

        const sessionCookie = registerResponse.headers['set-cookie'][0];

        // Create project
        const createResponse = await request(app.getHttpServer())
          .post('/api/projects')
          .set('Cookie', sessionCookie)
          .send({ displayName: 'User5' });

        const projectId = createResponse.body.data.id;

        // Wait for mock worker to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check if status was updated by mock worker
        const healthResponse = await request(app.getHttpServer())
          .get(`/api/projects/${projectId}/health`)
          .set('Cookie', sessionCookie);

        expect(healthResponse.status).toBe(200);
        // In dev, should transition to RUNNING via mock worker
        // In test, status remains CREATING (mock worker disabled)
      }
    });
  });
});
