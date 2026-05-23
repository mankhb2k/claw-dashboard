import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProjectConnectorsService } from './project-connectors.service';

@ApiTags('projects-connectors-catalog')
@Controller('projects')
export class ProjectConnectorsCatalogController {
  constructor(private readonly connectors: ProjectConnectorsService) {}

  @Get('connectors/definitions')
  listDefinitions() {
    return this.connectors.listDefinitions();
  }
}
