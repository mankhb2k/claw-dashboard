import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { InternalController } from './internal.controller';

@Module({
  imports: [ProjectsModule],
  controllers: [InternalController],
})
export class InternalModule {}
