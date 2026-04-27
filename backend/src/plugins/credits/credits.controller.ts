import { Controller, Get, HttpCode, Param, Query, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../../core/auth/guards/session.guard';
import { CurrentUser } from '../../core/common/decorators/current-user.decorator';
import { CreditService } from '../../core/billing/credit.service';

@Controller('api/credits')
@UseGuards(SessionGuard)
export class CreditsController {
  constructor(private readonly credits: CreditService) {}

  @Get('wallet')
  @HttpCode(200)
  async wallet(@CurrentUser() user: any) {
    return this.credits.getWallet(user.id);
  }

  @Get('history')
  @HttpCode(200)
  async history(
    @CurrentUser() user: any,
    @Query('take') take?: string,
  ) {
    const n = Number(take ?? '50');
    const safeTake = Number.isFinite(n) ? Math.max(1, Math.min(200, n)) : 50;
    return this.credits.listTransactions(user.id, safeTake);
  }

  @Get('cost/:tool')
  @HttpCode(200)
  async cost(@Param('tool') tool: string) {
    const normalized = tool.toUpperCase() as any;
    return {
      tool: normalized,
      credits: this.credits.getCost(normalized),
    };
  }
}
