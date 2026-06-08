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

export class AgentAiMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(16_000)
  content!: string;
}

export class AgentAiContextDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(32)
  vibe!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags!: string[];

  @ApiProperty({ enum: ['simple', 'advanced'] })
  @IsIn(['simple', 'advanced'])
  instructionsMode!: 'simple' | 'advanced';

  @ApiProperty()
  @IsString()
  @MaxLength(12_000)
  currentAgentsMd!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  activeEditTab?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(12_000)
  instructionsRole?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(12_000)
  instructionsRules?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(12_000)
  instructionsConstraints?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(12_000)
  instructionsOutputFormat?: string;
}

export class AgentAiCompleteDto {
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

  @ApiProperty({ enum: ['optimize', 'chat'] })
  @IsIn(['optimize', 'chat'])
  intent!: 'optimize' | 'chat';

  @ApiProperty({ type: [AgentAiMessageDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AgentAiMessageDto)
  messages!: AgentAiMessageDto[];

  @ApiProperty({ type: AgentAiContextDto })
  @ValidateNested()
  @Type(() => AgentAiContextDto)
  agentContext!: AgentAiContextDto;
}
