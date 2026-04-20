import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { WorkerSecretGuard } from './worker-secret.guard';

describe('WorkerSecretGuard', () => {
  let guard: WorkerSecretGuard;
  let mockContext: ExecutionContext;

  const TEST_SECRET = 'test-secret-key-12345';

  beforeEach(() => {
    guard = new WorkerSecretGuard();
    process.env.VPS_WORKER_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.VPS_WORKER_SECRET;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow valid Bearer token', () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Bearer ${TEST_SECRET}`,
          },
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should reject missing Authorization header', () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('Missing Authorization header');
  });

  it('should reject invalid Authorization format (missing Bearer)', () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: TEST_SECRET,
          },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow(
      'Invalid Authorization header format. Expected: Bearer {secret}'
    );
  });

  it('should reject invalid Authorization format (wrong prefix)', () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Basic ${TEST_SECRET}`,
          },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should reject invalid Bearer token (wrong secret)', () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer wrong-secret',
          },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(mockContext)).toThrow('Invalid worker secret');
  });

  it('should reject if VPS_WORKER_SECRET not configured', () => {
    delete process.env.VPS_WORKER_SECRET;

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Bearer ${TEST_SECRET}`,
          },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(
      'VPS_WORKER_SECRET environment variable not configured'
    );
  });

  it('should handle extra spaces in Bearer token', () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Bearer  ${TEST_SECRET}`,
          },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should be case-sensitive for Bearer prefix', () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `bearer ${TEST_SECRET}`,
          },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should be case-sensitive for secret value', () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Bearer ${TEST_SECRET.toUpperCase()}`,
          },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
