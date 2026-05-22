import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const SKILL_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

export class CreateProjectSkillDto {
  @ApiProperty({ example: 'my-skill' })
  @IsString()
  @Matches(SKILL_SLUG_PATTERN, {
    message: 'slug must be lowercase hyphen-case (a-z, 0-9, hyphen)',
  })
  slug!: string;

  @ApiProperty({ example: 'my-skill' })
  @IsString()
  @Matches(SKILL_SLUG_PATTERN)
  name!: string;

  @ApiProperty({ example: 'Does something useful for the agent.' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  heading?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(260_000)
  bodyMarkdown?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateProjectSkillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(SKILL_SLUG_PATTERN)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  heading?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(260_000)
  bodyMarkdown?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class SetProjectSkillEnabledDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
