import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'My workspace' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;
}
