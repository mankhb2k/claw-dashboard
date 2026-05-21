import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProjectProviderKeysService } from './providers/project-provider-keys.service';

/** Catalog provider/model — metadata tĩnh, không cần JWT. */
@ApiTags('projects-providers-catalog')
@Controller('projects')
export class ProjectProvidersCatalogController {
  constructor(private readonly providerKeys: ProjectProviderKeysService) {}

  @Get('providers/definitions')
  listProviderDefinitions() {
    return this.providerKeys.listDefinitions();
  }
}
