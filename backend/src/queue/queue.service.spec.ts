import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  let service: QueueService;
  let mockContainerOpsQueue: any;
  let mockHeavyTasksQueue: any;

  beforeEach(async () => {
    // Mock queue instances
    mockContainerOpsQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      count: jest.fn().mockResolvedValue(5),
      getDelayedCount: jest.fn().mockResolvedValue(2),
      getActiveCount: jest.fn().mockResolvedValue(1),
      getFailedCount: jest.fn().mockResolvedValue(0),
    };

    mockHeavyTasksQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-2' }),
      count: jest.fn().mockResolvedValue(3),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(1),
      getFailedCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken('container-ops'),
          useValue: mockContainerOpsQueue,
        },
        {
          provide: getQueueToken('heavy-tasks'),
          useValue: mockHeavyTasksQueue,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueSpawn', () => {
    it('should add spawn job to container-ops queue', async () => {
      await service.enqueueSpawn('proj-1', 'user-1', 'sub123', 'openclaw:1.0', 0.5, 1024);

      expect(mockContainerOpsQueue.add).toHaveBeenCalledWith(
        'spawn',
        {
          projectId: 'proj-1',
          userId: 'user-1',
          subdomain: 'sub123',
          imageVersion: 'openclaw:1.0',
          cpuLimit: 0.5,
          ramLimit: 1024,
        },
        expect.objectContaining({
          priority: 5,
          attempts: 3,
          timeout: 120000,
        }),
      );
    });
  });

  describe('enqueueWake', () => {
    it('should add wake job with highest priority', async () => {
      await service.enqueueWake('proj-1', 'user-1');

      expect(mockContainerOpsQueue.add).toHaveBeenCalledWith(
        'wake',
        { projectId: 'proj-1', userId: 'user-1' },
        expect.objectContaining({
          priority: 1,
          attempts: 2,
          timeout: 30000,
        }),
      );
    });
  });

  describe('enqueueStop', () => {
    it('should add stop job with lowest priority', async () => {
      await service.enqueueStop('proj-1', 'user-1');

      expect(mockContainerOpsQueue.add).toHaveBeenCalledWith(
        'stop',
        { projectId: 'proj-1', userId: 'user-1' },
        expect.objectContaining({
          priority: 10,
          attempts: 1,
          timeout: 60000,
        }),
      );
    });
  });

  describe('enqueueDestroy', () => {
    it('should add destroy job with no retries', async () => {
      await service.enqueueDestroy('proj-1', 'user-1');

      expect(mockContainerOpsQueue.add).toHaveBeenCalledWith(
        'destroy',
        { projectId: 'proj-1', userId: 'user-1' },
        expect.objectContaining({
          priority: 5,
          attempts: 0, // No retries
          timeout: 120000,
        }),
      );
    });
  });

  describe('Heavy tasks', () => {
    it('should enqueue FFmpeg job and return job ID', async () => {
      const jobId = await service.enqueueFFmpeg('user-1', 'proj-1', { video: 'test.mp4' });

      expect(jobId).toBe('job-2');
      expect(mockHeavyTasksQueue.add).toHaveBeenCalledWith(
        'ffmpeg',
        { userId: 'user-1', projectId: 'proj-1', params: { video: 'test.mp4' } },
        expect.objectContaining({
          attempts: 1,
          timeout: 300000,
        }),
      );
    });

    it('should enqueue Playwright job', async () => {
      await service.enqueuePlaywright('user-1', 'proj-1', { url: 'https://example.com' });

      expect(mockHeavyTasksQueue.add).toHaveBeenCalledWith(
        'playwright',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should enqueue TTS job', async () => {
      await service.enqueueTTS('user-1', 'proj-1', { text: 'hello' });

      expect(mockHeavyTasksQueue.add).toHaveBeenCalledWith(
        'tts',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should enqueue STT job', async () => {
      await service.enqueueSTT('user-1', 'proj-1', { audio: 'test.wav' });

      expect(mockHeavyTasksQueue.add).toHaveBeenCalledWith(
        'stt',
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe('Queue stats', () => {
    it('should get container-ops queue stats', async () => {
      const stats = await service.getContainerOpsQueueStats();

      expect(stats).toEqual({
        total: 5,
        delayed: 2,
        active: 1,
        failed: 0,
      });
    });

    it('should get heavy-tasks queue stats', async () => {
      const stats = await service.getHeavyTasksQueueStats();

      expect(stats).toEqual({
        total: 3,
        delayed: 0,
        active: 1,
        failed: 0,
      });
    });
  });
});
