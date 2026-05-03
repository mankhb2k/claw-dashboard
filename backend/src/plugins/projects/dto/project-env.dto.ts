import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProjectEnvEntryDto {
  @ApiProperty({ example: 'OPENAI_API_KEY' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  value!: string;
}

export class UpsertProjectEnvDto {
  @ApiProperty({ type: [ProjectEnvEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProjectEnvEntryDto)
  env!: ProjectEnvEntryDto[];
}

export class DeleteProjectEnvDto {
  @ApiProperty({ example: 'OPENAI_API_KEY' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  key!: string;
}
