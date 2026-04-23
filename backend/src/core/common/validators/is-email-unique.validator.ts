import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PrismaService } from '../../database/prisma.service';

@ValidatorConstraint({ name: 'isEmailUnique', async: true })
@Injectable()
export class IsEmailUniqueValidator implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return !user; // true if email doesn't exist (valid)
  }

  defaultMessage(args: ValidationArguments): string {
    return `Email "${args.value}" is already registered`;
  }
}
