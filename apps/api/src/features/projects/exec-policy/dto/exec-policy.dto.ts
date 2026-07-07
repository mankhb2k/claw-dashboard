import { IsArray, IsIn, IsInt, IsString, Max, Min } from 'class-validator';

export class UpdateProjectExecPolicyDto {
  @IsIn(['always', 'on-miss', 'off'])
  askPolicy!: 'always' | 'on-miss' | 'off';

  @IsArray()
  @IsString({ each: true })
  safeBins!: string[];

  @IsInt()
  @Min(5)
  @Max(86400)
  timeoutSec!: number;
}
