import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum ProjectStatus {
  CREATING = 'CREATING',
  RUNNING = 'RUNNING',
  STARTING = 'STARTING',
  STOPPED = 'STOPPED',
  STOPPING = 'STOPPING',
  ERROR = 'ERROR',
  DESTROYING = 'DESTROYING',
}

export class UpdateStatusDto {
  @IsString()
  projectId!: string;

  @IsEnum(ProjectStatus)
  status!: ProjectStatus;

  @IsOptional()
  @IsString()
  containerId?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
