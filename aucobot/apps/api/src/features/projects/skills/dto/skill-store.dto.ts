import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const SKILL_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

export class SkillStoreSearchQueryDto {
  @ApiPropertyOptional({ description: 'Search by slug/name/description' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'ClawHub pagination cursor (browse mode only)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cursor?: string;

  @ApiPropertyOptional({ description: 'Page size for browse mode (1–200, default 50)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Browse sort (recommended | downloads | stars | newest | updated)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  sort?: string;
}

export class InstallSkillFromStoreDto {
  @ApiProperty({ example: 'google-search' })
  @IsString()
  @MinLength(2)
  @Matches(SKILL_SLUG_PATTERN, {
    message: 'slug must be lowercase hyphen-case (a-z, 0-9, hyphen)',
  })
  slug!: string;
}
