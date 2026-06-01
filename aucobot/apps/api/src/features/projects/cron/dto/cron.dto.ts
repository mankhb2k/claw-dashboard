import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ListCronQueryDto {
  @IsOptional()
  @IsString()
  agentId?: string;
}

export class CreateCronJobDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  agentId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  message!: string;

  @IsIn(['cron', 'every', 'at'])
  scheduleKind!: 'cron' | 'every' | 'at';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cronExpr?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60 * 24 * 7)
  everyMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  at?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateCronJobDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  message?: string;

  @IsOptional()
  @IsIn(['cron', 'every', 'at'])
  scheduleKind?: 'cron' | 'every' | 'at';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cronExpr?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60 * 24 * 7)
  everyMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  at?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
