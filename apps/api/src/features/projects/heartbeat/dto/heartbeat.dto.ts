import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProjectHeartbeatDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @MaxLength(32)
  every!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12000)
  heartbeatMd?: string | null;
}

export class UpdateAgentHeartbeatDto {
  @IsIn(['off', 'inherit', 'custom'])
  mode!: 'off' | 'inherit' | 'custom';

  @IsOptional()
  @IsString()
  @MaxLength(32)
  every?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(12000)
  heartbeatMd?: string | null;
}
