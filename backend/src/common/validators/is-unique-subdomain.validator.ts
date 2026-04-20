import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

@ValidatorConstraint({ name: 'IsUniqueSubdomain', async: true })
@Injectable()
export class IsUniqueSubdomainValidator implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(subdomain: string, args: ValidationArguments): Promise<boolean> {
    if (!subdomain) return true; // Let @IsString handle empty values

    // Validate format: lowercase alphanumeric + hyphen, 1-63 chars
    if (!/^[a-z0-9-]{1,63}$/.test(subdomain)) return false;

    const existing = await this.prisma.project.findUnique({ where: { subdomain } });
    return !existing;
  }

  defaultMessage(): string {
    return 'Subdomain must be unique and contain only lowercase letters, numbers, and hyphens';
  }
}
