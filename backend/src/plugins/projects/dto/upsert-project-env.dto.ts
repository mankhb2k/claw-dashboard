import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectEnvEntryDto {
  @ApiProperty({ example: 'OPENAI_API_KEY' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  key!: string;

  @ApiProperty({ example: 'sk-xxxx' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  value!: string;
}

export class UpsertProjectEnvDto {
  @ApiProperty({ type: [ProjectEnvEntryDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProjectEnvEntryDto)
  env!: ProjectEnvEntryDto[];
}
