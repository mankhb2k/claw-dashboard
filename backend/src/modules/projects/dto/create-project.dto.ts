import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'My bot' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  @ApiPropertyOptional({
    description: 'URL-safe slug; leave empty for auto-generated id',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(64)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Gợi ý thư mục workspace trên máy user',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  syncPathHint?: string;
}
