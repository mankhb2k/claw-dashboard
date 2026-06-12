import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProviderKeysService } from './services/provider-keys/provider-keys.service';

/** Catalog provider/model — metadata static, no JWT */
@ApiTags('projects-providers-catalog')
@Controller('projects')
export class ProvidersCatalogController {
  constructor(private readonly providerKeys: ProviderKeysService) {}

  @Get('providers/definitions')
  listProviderDefinitions() {
    return this.providerKeys.listDefinitions();
  }
}
