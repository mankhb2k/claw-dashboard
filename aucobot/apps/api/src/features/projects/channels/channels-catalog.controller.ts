import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';

@ApiTags('channels-catalog')
@Controller('projects')
export class ChannelsCatalogController {
  constructor(private readonly channels: ChannelsService) {}

  @Get('channels/definitions')
  listDefinitions() {
    return this.channels.listDefinitions();
  }
}
