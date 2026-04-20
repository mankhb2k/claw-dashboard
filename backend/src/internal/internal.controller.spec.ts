import { Test, TestingModule } from '@nestjs/testing';
import { InternalController } from './internal.controller';
import { ProjectsService } from '../projects/projects.service';
import { WorkerSecretGuard } from './guards/worker-secret.guard';
import { UpdateStatusDto, ProjectStatus } from './dtos/update-status.dto';
import { UpdateHeartbeatDto } from './dtos/update-heartbeat.dto';

describe('InternalController', () => {
  let controller: InternalController;
  let projectsService: any;

  const mockProject = {
    id: 'proj-1',
    status: ProjectStatus.RUNNING,
    lastActiveAt: new Date(),
  };

  beforeEach(async () => {
    projectsService = {
      updateProjectStatus: jest.fn().mockResolvedValue(mockProject),
      updateLastActiveAt: jest.fn().mockResolvedValue(mockProject),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalController],
      providers: [
        { provide: ProjectsService, useValue: projectsService },
        { provide: WorkerSecretGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
      ],
    }).compile();

    controller = module.get<InternalController>(InternalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should update project status', async () => {
      const dto: UpdateStatusDto = {
        projectId: 'proj-1',
        status: ProjectStatus.RUNNING,
        containerId: 'inst-1',
      };

      const result = await controller.updateStatus(dto);

      expect(projectsService.updateProjectStatus).toHaveBeenCalledWith(
        'proj-1',
        ProjectStatus.RUNNING,
        'inst-1',
      );
      expect(result).toEqual({
        projectId: mockProject.id,
        status: mockProject.status,
      });
    });

    it('should update project status without containerId', async () => {
      const dto: UpdateStatusDto = {
        projectId: 'proj-1',
        status: ProjectStatus.STOPPED,
      };

      await controller.updateStatus(dto);

      expect(projectsService.updateProjectStatus).toHaveBeenCalledWith(
        'proj-1',
        ProjectStatus.STOPPED,
        undefined,
      );
    });

    it('should handle status update error', async () => {
      projectsService.updateProjectStatus.mockRejectedValue(
        new Error('Project not found'),
      );

      const dto: UpdateStatusDto = {
        projectId: 'nonexistent',
        status: ProjectStatus.RUNNING,
      };

      await expect(controller.updateStatus(dto)).rejects.toThrow('Project not found');
    });
  });

  describe('updateHeartbeat', () => {
    it('should update project heartbeat', async () => {
      const now = new Date().toISOString();
      const dto: UpdateHeartbeatDto = {
        projectId: 'proj-1',
        lastActiveAt: now,
      };

      const result = await controller.updateHeartbeat(dto);

      expect(projectsService.updateLastActiveAt).toHaveBeenCalledWith(
        'proj-1',
        expect.any(Date),
      );
      expect(result).toEqual({
        projectId: mockProject.id,
        lastActiveAt: mockProject.lastActiveAt,
      });
    });

    it('should handle heartbeat update error', async () => {
      projectsService.updateLastActiveAt.mockRejectedValue(
        new Error('Project not found'),
      );

      const dto: UpdateHeartbeatDto = {
        projectId: 'nonexistent',
        lastActiveAt: new Date().toISOString(),
      };

      await expect(controller.updateHeartbeat(dto)).rejects.toThrow(
        'Project not found',
      );
    });
  });
});
