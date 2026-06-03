import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class RenameNodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;
}

export class CreateNodeInviteDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  ttlMinutes?: number;
}

export class RedeemNodeInviteDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  code!: string;
}
