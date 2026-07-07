import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({
    description: 'Refresh token; omitted when using oc_refresh cookie',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  refreshToken?: string;
}
