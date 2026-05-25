import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateUserAvatarDto {
  @ApiProperty({
    description: 'Avatar image URL; send null to clear',
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  avatarUrl!: string | null;
}
