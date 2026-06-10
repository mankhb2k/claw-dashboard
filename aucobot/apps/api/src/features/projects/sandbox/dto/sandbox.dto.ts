import { IsArray, IsBoolean, IsIn, IsString } from 'class-validator';

export class UpdateProjectSandboxDto {
  @IsBoolean()
  enabled!: boolean;

  @IsIn(['all', 'selected'])
  mode!: 'all' | 'selected';

  @IsArray()
  @IsString({ each: true })
  exemptAgentSlugs!: string[];

  @IsArray()
  @IsString({ each: true })
  appliedAgentSlugs!: string[];
}
