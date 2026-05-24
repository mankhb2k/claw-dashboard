import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProjectChannelsService } from './project-channels.service';

@ApiTags('projects-channels-catalog')
@Controller('projects')
export class ProjectChannelsCatalogController {
  constructor(private readonly channels: ProjectChannelsService) {}

  @Get('channels/definitions')
  listDefinitions() {
    return this.channels.listDefinitions();
  }
}
