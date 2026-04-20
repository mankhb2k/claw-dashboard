import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProjectsController } from './projects.controller';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: any;

  beforeEach(() => {
    service = {
      findByUser: jest.fn(),
      create: jest.fn(),
      getHealth: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      remove: jest.fn(),
      getInstances: jest.fn(),
    };

    controller = new ProjectsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('mine', () => {
    it('should list user projects', async () => {
      const userId = 'user-1';
      const mockProjects = [{ id: 'proj-1', userId, subdomain: 'abc123' }];

      service.findByUser.mockResolvedValue(mockProjects);

      const result = await controller.mine({ id: userId } as any);

      expect(result.data).toEqual(mockProjects);
      expect(service.findByUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('create', () => {
    it('should create project', async () => {
      const userId = 'user-1';
      const mockProject = { id: 'proj-1', userId, status: 'CREATING' };

      service.create.mockResolvedValue(mockProject);

      const result = await controller.create({ id: userId } as any);

      expect(result.data).toEqual(mockProject);
      expect(service.create).toHaveBeenCalledWith(userId);
    });

    it('should throw ConflictException for plan limit', async () => {
      const userId = 'user-1';

      service.create.mockRejectedValue(
        new BadRequestException('Free plan allows 1 project. Upgrade to Pro for more.'),
      );

      await expect(controller.create({ id: userId } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('health', () => {
    it('should get project health', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockHealth = { status: 'RUNNING', subdomain: 'abc123' };

      service.getHealth.mockResolvedValue(mockHealth);

      const result = await controller.health(projectId, { id: userId } as any);

      expect(result.data).toEqual(mockHealth);
      expect(service.getHealth).toHaveBeenCalledWith(projectId, userId);
    });

    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'nonexistent';
      const userId = 'user-1';

      service.getHealth.mockRejectedValue(new NotFoundException('Project not found'));

      await expect(controller.health(projectId, { id: userId } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not owner', async () => {
      const projectId = 'proj-1';
      const userId = 'other-user';

      service.getHealth.mockRejectedValue(new ForbiddenException('Not your project'));

      await expect(controller.health(projectId, { id: userId } as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('start', () => {
    it('should start project', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockResult = { status: 'STARTING' };

      service.start.mockResolvedValue(mockResult);

      const result = await controller.start(projectId, {}, { id: userId } as any);

      expect(result.data).toEqual(mockResult);
      expect(service.start).toHaveBeenCalledWith(projectId, userId);
    });

    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'nonexistent';
      const userId = 'user-1';

      service.start.mockRejectedValue(new NotFoundException('Project not found'));

      await expect(controller.start(projectId, {}, { id: userId } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if invalid state', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';

      service.start.mockRejectedValue(
        new BadRequestException('Cannot start project in status: CREATING'),
      );

      await expect(controller.start(projectId, {}, { id: userId } as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('stop', () => {
    it('should stop project', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockResult = { status: 'STOPPING' };

      service.stop.mockResolvedValue(mockResult);

      const result = await controller.stop(projectId, {}, { id: userId } as any);

      expect(result.data).toEqual(mockResult);
      expect(service.stop).toHaveBeenCalledWith(projectId, userId);
    });

    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'nonexistent';
      const userId = 'user-1';

      service.stop.mockRejectedValue(new NotFoundException('Project not found'));

      await expect(controller.stop(projectId, {}, { id: userId } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('instances', () => {
    it('should get container instances', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockInstances = [{ id: 'inst-1', status: 'RUNNING' }];

      service.getInstances.mockResolvedValue(mockInstances);

      const result = await controller.instances(projectId, { id: userId } as any);

      expect(result.data).toEqual(mockInstances);
      expect(service.getInstances).toHaveBeenCalledWith(projectId, userId);
    });
  });

  describe('remove', () => {
    it('should delete project', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockResult = { deleted: true };

      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove(projectId, { id: userId } as any);

      expect(result.data).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith(projectId, userId);
    });

    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'nonexistent';
      const userId = 'user-1';

      service.remove.mockRejectedValue(new NotFoundException('Project not found'));

      await expect(controller.remove(projectId, { id: userId } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if still running', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';

      service.remove.mockRejectedValue(new BadRequestException('Stop the project before deleting'));

      await expect(controller.remove(projectId, { id: userId } as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
