import { IsString, IsEnum, IsObject, IsNotEmpty } from 'class-validator';

enum HeavyToolEnum {
  FFMPEG = 'FFMPEG',
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
  tool!: 'FFMPEG' | 'PLAYWRIGHT' | 'TTS' | 'STT';

  @IsObject()
  @IsNotEmpty()
  params!: Record<string, any>;
}
