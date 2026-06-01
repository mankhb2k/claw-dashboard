import { IsArray, IsBoolean, IsString, ArrayMaxSize } from 'class-validator';

export class UpdateCollaborationDto {
  @IsBoolean()
  enabled!: boolean;

  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  memberSlugs!: string[];
}
