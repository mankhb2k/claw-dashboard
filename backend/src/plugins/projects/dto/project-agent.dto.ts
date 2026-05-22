import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const AGENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;

export class CreateProjectAgentDto {
  @ApiPropertyOptional({ example: 'sales-bot' })
  @IsOptional()
  @IsString()
  @Matches(AGENT_SLUG_PATTERN, {
    message: 'slug must be lowercase hyphen-case (a-z, 0-9, hyphen)',
  })
  slug?: string;

  @ApiProperty({ description: 'AgentFormInput JSON' })
  @IsObject()
  formData!: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateProjectAgentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SetProjectAgentEnabledDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}

export class DuplicateProjectAgentDto {
  @ApiPropertyOptional({ example: 'sales-bot-copy' })
  @IsOptional()
  @IsString()
  @Matches(AGENT_SLUG_PATTERN)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;
}
