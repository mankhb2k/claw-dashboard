import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma.service';
import { QueueService } from '../../core/queue/queue.service';

@Injectable()
export class IdleDetectionService {
  private readonly logger = new Logger(IdleDetectionService.name);

  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
  ) {}

  @Cron('*/1 * * * *')
  async detectAndStopIdleProjects() {
    try {
      const projects = await this.prisma.project.findMany({
        where: {
          status: 'RUNNING',
        },
        include: {
          plan: true,
        },
      });

      for (const project of projects) {
        const idleTimeoutMin = project.plan.idleTimeoutMin;
        const idleThreshold = new Date(Date.now() - idleTimeoutMin * 60 * 1000);

        if (project.lastActiveAt < idleThreshold) {
          this.logger.log(
            `Project ${project.id} (${project.subdomain}) idle for ${idleTimeoutMin}min, stopping...`,
          );

          // Mark project as stopped (idle stop)
          await this.prisma.project.update({
            where: { id: project.id },
            data: { status: 'STOPPED' },
          });

          // Enqueue stop job with lowest priority
          await this.queue.enqueueStop(project.id, project.userId);
        }
      }
    } catch (error) {
      this.logger.error(
        `Idle detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // For testing: manually trigger idle detection
  async triggerManual() {
    await this.detectAndStopIdleProjects();
  }
}
