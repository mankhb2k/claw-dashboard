import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class OverviewQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateFrom must be YYYY-MM-DD' })
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateTo must be YYYY-MM-DD' })
  dateTo?: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  chartPeriod: 'day' | 'week' | 'month' = 'week';
}
