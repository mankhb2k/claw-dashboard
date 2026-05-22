import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SkillAssistantMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(16_000)
  content!: string;
}

export class SkillAssistantContextDto {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  slug!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  heading?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(260_000)
  currentBodyMarkdown?: string;
}

export class SkillAssistantCompleteDto {
  @ApiProperty({ example: 'gemini' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  providerId!: string;

  @ApiProperty({ example: 'google/gemini-2.5-flash' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  model!: string;

  @ApiProperty({ type: [SkillAssistantMessageDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SkillAssistantMessageDto)
  messages!: SkillAssistantMessageDto[];

  @ApiProperty({ type: SkillAssistantContextDto })
  @ValidateNested()
  @Type(() => SkillAssistantContextDto)
  skillContext!: SkillAssistantContextDto;
}
