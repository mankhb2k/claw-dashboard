import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectConnectorDto {
  @ApiProperty({ example: 'google-drive' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/)
  connectorSlug!: string;

  @ApiPropertyOptional({ example: 'Google Drive Team A' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ type: Object, description: 'Non-secret connector settings' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdateProjectConnectorDto {
  @ApiPropertyOptional({ example: 'Google Drive Team A' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ type: Object, description: 'Non-secret connector settings' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpsertProjectConnectorSecretDto {
  @ApiProperty({ example: 'sk-demo-secret' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(5000)
  value!: string;
}
