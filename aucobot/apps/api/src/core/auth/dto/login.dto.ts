import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Username', example: 'admin' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username may only contain letters, numbers, underscore and hyphen',
  })
  username!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;
}
