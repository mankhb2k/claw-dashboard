import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateJobResultDto {
  @IsEnum(['DONE', 'FAILED'])
  status!: 'DONE' | 'FAILED';

  @IsOptional()
  @IsString()
  resultPath?: string;

  @IsOptional()
  @IsNumber()
  resultSizeMb?: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
