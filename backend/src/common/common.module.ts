import { Module } from '@nestjs/common';
import { IsEmailUniqueValidator } from './validators/is-email-unique.validator';
import { IsValidCuidValidator } from './validators/is-valid-cuid.validator';
import { IsUniqueSubdomainValidator } from './validators/is-unique-subdomain.validator';

@Module({
  providers: [IsEmailUniqueValidator, IsValidCuidValidator, IsUniqueSubdomainValidator],
  exports: [IsEmailUniqueValidator, IsValidCuidValidator, IsUniqueSubdomainValidator],
})
export class CommonModule {}
