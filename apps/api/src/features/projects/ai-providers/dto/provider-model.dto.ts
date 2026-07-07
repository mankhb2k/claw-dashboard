import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddProviderModelDto {
  @ApiProperty({ example: 'openrouter/anthropic/claude-sonnet-4-6' })
  @IsString()
  @MaxLength(300)
  openclawId!: string;

  @ApiPropertyOptional({ example: 'Claude Sonnet via OpenRouter' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  setDefault?: boolean;
}

export class UpdateProviderModelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  setDefault?: boolean;
}
