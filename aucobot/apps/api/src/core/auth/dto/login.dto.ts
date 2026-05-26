import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email or username', example: 'admin' })
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  login!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;
}
