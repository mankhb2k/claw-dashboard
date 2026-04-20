import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { QueueConsumerService } from './queue-consumer.service';
import { ProjectStatus } from '../internal/dtos/update-status.dto';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('QueueConsumerService', () => {
  let service: QueueConsumerService;
  let mockQueue: any;

  beforeEach(async () => {
    // Reset environment
    process.env.NODE_ENV = 'development';
    process.env.VPS_WORKER_SECRET = 'test-secret';
    process.env.PORT = '3001';

    mockQueue = {
      process: jest.fn(),
      on: jest.fn(),
    };

    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { projectId: 'proj-1', status: ProjectStatus.RUNNING },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueConsumerService,
        {
          provide: getQueueToken('container-ops'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<QueueConsumerService>(QueueConsumerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should disable mock worker in production mode', async () => {
    process.env.NODE_ENV = 'production';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueConsumerService,
        {
          provide: getQueueToken('container-ops'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    const prodService = module.get<QueueConsumerService>(QueueConsumerService);
    await prodService.onModuleInit();

    expect(mockQueue.process).not.toHaveBeenCalled();
  });

  it('should initialize mock worker on module init', async () => {
    await service.onModuleInit();

    expect(mockQueue.on).toHaveBeenCalledWith('global:completed', expect.any(Function));
    expect(mockQueue.on).toHaveBeenCalledWith('global:failed', expect.any(Function));
    expect(mockQueue.process).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should handle spawn job', async () => {
    const spawnJob = {
      name: 'spawn',
      data: {
        projectId: 'proj-1',
        userId: 'user-1',
        subdomain: 'abc123',
        imageVersion: 'openclaw:latest',
        cpuLimit: 0.5,
        ramLimit: 1024,
      },
    };

    await service.onModuleInit();

    // Get the process handler
    const processHandler = mockQueue.process.mock.calls[0][0];
    await processHandler(spawnJob);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3001/api/internal/status',
      expect.objectContaining({
        projectId: 'proj-1',
        status: ProjectStatus.RUNNING,
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-secret',
        }),
      }),
    );
  });

  it('should handle wake job', async () => {
    const wakeJob = {
      name: 'wake',
      data: {
        projectId: 'proj-1',
        userId: 'user-1',
      },
    };

    await service.onModuleInit();

    const processHandler = mockQueue.process.mock.calls[0][0];
    await processHandler(wakeJob);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal/status'),
      expect.objectContaining({
        projectId: 'proj-1',
        status: ProjectStatus.RUNNING,
      }),
      expect.any(Object),
    );
  });

  it('should handle stop job', async () => {
    const stopJob = {
      name: 'stop',
      data: {
        projectId: 'proj-1',
        userId: 'user-1',
      },
    };

    await service.onModuleInit();

    const processHandler = mockQueue.process.mock.calls[0][0];
    await processHandler(stopJob);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal/status'),
      expect.objectContaining({
        projectId: 'proj-1',
        status: ProjectStatus.STOPPED,
      }),
      expect.any(Object),
    );
  });

  it('should handle destroy job', async () => {
    const destroyJob = {
      name: 'destroy',
      data: {
        projectId: 'proj-1',
        userId: 'user-1',
      },
    };

    await service.onModuleInit();

    const processHandler = mockQueue.process.mock.calls[0][0];
    await processHandler(destroyJob);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal/status'),
      expect.objectContaining({
        projectId: 'proj-1',
        status: ProjectStatus.DESTROYING,
      }),
      expect.any(Object),
    );
  });

  it('should reject unknown job type', async () => {
    const unknownJob = {
      name: 'unknown',
      data: {
        projectId: 'proj-1',
        userId: 'user-1',
      },
    };

    await service.onModuleInit();

    const processHandler = mockQueue.process.mock.calls[0][0];
    await processHandler(unknownJob);

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should retry on API failure', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Connection failed'));

    const spawnJob = {
      name: 'spawn',
      data: {
        projectId: 'proj-1',
        userId: 'user-1',
        subdomain: 'abc123',
        imageVersion: 'openclaw:latest',
        cpuLimit: 0.5,
        ramLimit: 1024,
      },
    };

    await service.onModuleInit();

    const processHandler = mockQueue.process.mock.calls[0][0];

    await expect(processHandler(spawnJob)).rejects.toThrow('Connection failed');
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  it('should use environment variables for API endpoint', async () => {
    process.env.PORT = '4000';

    const spawnJob = {
      name: 'spawn',
      data: {
        projectId: 'proj-1',
        userId: 'user-1',
        subdomain: 'abc123',
        imageVersion: 'openclaw:latest',
        cpuLimit: 0.5,
        ramLimit: 1024,
      },
    };

    await service.onModuleInit();

    const processHandler = mockQueue.process.mock.calls[0][0];
    await processHandler(spawnJob);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:4000/api/internal/status',
      expect.any(Object),
      expect.any(Object),
    );
  });
});
