import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

// CUID format: /^[a-z0-9]+$/
const CUID_REGEX = /^[a-z0-9]+$/;

@ValidatorConstraint({ name: 'isValidCuid' })
export class IsValidCuidValidator implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return typeof value === 'string' && value.length > 0 && CUID_REGEX.test(value);
  }

  defaultMessage(): string {
    return 'Invalid ID format';
  }
}
