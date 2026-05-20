import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertSecretDto {
  @ApiProperty({ description: 'Plaintext; stored encrypted' })
  @IsString()
  @MinLength(1)
  @MaxLength(32_000)
  value!: string;
}
