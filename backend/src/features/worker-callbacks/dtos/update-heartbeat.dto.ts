import { IsString, IsISO8601 } from 'class-validator';

export class UpdateHeartbeatDto {
  @IsString()
  projectId!: string;

  @IsISO8601()
  lastActiveAt!: string;
}
