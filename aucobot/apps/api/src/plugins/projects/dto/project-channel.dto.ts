import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProjectChannelDto {
  @ApiProperty({ example: 'telegram' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  channelId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdateProjectChannelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpsertChannelSecretDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  value!: string;
}
