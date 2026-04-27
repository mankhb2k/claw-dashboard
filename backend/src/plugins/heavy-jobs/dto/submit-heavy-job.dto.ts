import { IsString, IsEnum, IsObject, IsNotEmpty } from 'class-validator';

enum HeavyToolEnum {
  FFMPEG_SHORT = 'FFMPEG_SHORT',
  FFMPEG_LONG = 'FFMPEG_LONG',
  PLAYWRIGHT = 'PLAYWRIGHT',
  TTS = 'TTS',
  STT = 'STT',
}

export class SubmitHeavyJobDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsEnum(HeavyToolEnum)
  @IsNotEmpty()
  tool!: 'FFMPEG_SHORT' | 'FFMPEG_LONG' | 'PLAYWRIGHT' | 'TTS' | 'STT';

  @IsObject()
  @IsNotEmpty()
  params!: Record<string, any>;
}
