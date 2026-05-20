import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class SaveWorkspaceDto {
  @ApiProperty({
    additionalProperties: { type: 'string' },
    example: { 'AGENTS.md': '# Agent\n', 'SOUL.md': '' },
  })
  @IsObject()
  files!: Record<string, string>;
}
