import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SaveKeyDto {
  @ApiProperty({ description: 'Plain API key' })
  @IsString()
  @MinLength(8)
  @MaxLength(5000)
  apiKey!: string;

  @ApiPropertyOptional({ example: 'Default Connection' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiPropertyOptional({ example: 'google/gemini-2.5-flash' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  defaultModel?: string;
}

export class SetEnabledDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
