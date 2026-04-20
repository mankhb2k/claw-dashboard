import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Password must not be empty' })
  @MaxLength(128)
  password!: string;
}
