import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetChatModelDto {
  @ApiProperty({ example: 'main', description: 'Agent id (main or custom slug)' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  agentId!: string;

  @ApiProperty({ example: 'google/gemini-2.5-flash' })
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  model!: string;
}
