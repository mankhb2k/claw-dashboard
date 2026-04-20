import { IsEmail, IsString, MinLength, MaxLength, Validate } from 'class-validator';
import { IsEmailUniqueValidator } from '../../common/validators/is-email-unique.validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email must be valid' })
  @Validate(IsEmailUniqueValidator)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password!: string;

  @IsString()
  @MinLength(1, { message: 'Name must not be empty' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;
}
