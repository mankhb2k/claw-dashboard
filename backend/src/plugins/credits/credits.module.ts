import { Module } from '@nestjs/common';
import { BillingModule } from '../../core/billing/billing.module';
import { AuthModule } from '../../core/auth/auth.module';
import { CreditsController } from './credits.controller';

@Module({
  imports: [BillingModule, AuthModule],
  controllers: [CreditsController],
})
export class CreditsModule {}
