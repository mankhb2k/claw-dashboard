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

describe('Auth API (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'ValidPassword123!';
  const testName = 'Test User';

  beforeAll(async () => {
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

    // Setup ValidationPipe (same as main.ts)
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

    // Clean up test user if exists
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/sign-up/email', () => {
    it('should register a new user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName,
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        id: expect.any(String),
        email: testEmail,
        name: testName,
        image: null,
        emailVerified: false,
        createdAt: expect.any(String),
      });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: 'not-an-email',
          password: testPassword,
          name: testName,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email must be valid');
    });

    it('should reject short password (< 8 chars)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: `short-${Date.now()}@example.com`,
          password: 'short',
          name: testName,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 8 characters');
    });

    it('should reject duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already registered');
    });

    it('should reject missing fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: testEmail,
          // missing password and name
        });

      expect(response.status).toBe(400);
    });

    it('should reject empty name', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: `empty-name-${Date.now()}@example.com`,
          password: testPassword,
          name: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('must not be empty');
    });

    it('should reject name > 100 chars', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: `long-name-${Date.now()}@example.com`,
          password: testPassword,
          name: 'a'.repeat(101),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('must not exceed 100');
    });

    it('should reject extra fields (whitelist)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: `whitelist-${Date.now()}@example.com`,
          password: testPassword,
          name: testName,
          extraField: 'should-be-ignored',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('property extraField should not exist');
    });
  });

  describe('POST /api/auth/sign-in/email', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(testEmail);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: 'invalid-email',
          password: testPassword,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email must be valid');
    });

    it('should reject wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        });

      expect(response.status).toBe(401);
    });

    it('should reject empty password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: testEmail,
          password: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/get-session', () => {
    let sessionCookie: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: testEmail,
          password: testPassword,
        });

      sessionCookie = response.headers['set-cookie'][0];
    });

    it('should return current user with valid session', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        id: expect.any(String),
        email: testEmail,
        name: testName,
        image: null,
        emailVerified: false,
        createdAt: expect.any(String),
      });
    });

    it('should reject request without session', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/get-session');

      expect(response.status).toBe(401);
    });

    it('should reject invalid session token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', 'better-auth.session_token=invalid-token-12345');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/sign-out', () => {
    let sessionCookie: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: testEmail,
          password: testPassword,
        });

      sessionCookie = response.headers['set-cookie'][0];
    });

    it('should logout and invalidate session', async () => {
      // First logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/auth/sign-out')
        .set('Cookie', sessionCookie);

      expect(logoutResponse.status).toBe(200);

      // Then try to use same session
      const sessionResponse = await request(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', sessionCookie);

      expect(sessionResponse.status).toBe(401);
    });

    it('should allow logout without session', async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/sign-out');

      expect(response.status).toBe(200);
    });
  });
});
