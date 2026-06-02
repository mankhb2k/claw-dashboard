import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const SKILL_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

export class SkillStoreSearchQueryDto {
  @ApiPropertyOptional({ description: 'Search by slug/name/description' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
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
