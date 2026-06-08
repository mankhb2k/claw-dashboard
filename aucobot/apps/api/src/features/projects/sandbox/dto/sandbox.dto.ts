import { IsBoolean, IsIn } from 'class-validator';

export class UpdateProjectSandboxDto {
  @IsBoolean()
  enabled!: boolean;

  @IsIn(['non-main', 'all'])
  mode!: 'non-main' | 'all';
}
