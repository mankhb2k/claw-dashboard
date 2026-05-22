import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../core/common/decorators/current-user.decorator';
import { SaveProviderKeyDto, SetProviderEnabledDto } from './dto/provider-key.dto';
import { ProjectsService } from './projects.service';
import { ProjectProviderKeysService } from './providers/project-provider-keys.service';

@ApiTags('projects-provider-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectProviderKeysController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly providerKeys: ProjectProviderKeysService,
  ) {}

  @Get(':id/provider-keys')
  async list(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerKeys.listMasked(id);
  }

  @Put(':id/provider-keys/:providerId')
  async saveAndTest(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
    @Body() dto: SaveProviderKeyDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerKeys.saveAndTest({
      projectId: id,
      providerId,
      apiKey: dto.apiKey,
      label: dto.label,
      defaultModel: dto.defaultModel,
    });
  }

  @Patch(':id/provider-keys/:providerId/enabled')
  async setEnabled(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
    @Body() dto: SetProviderEnabledDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerKeys.setEnabled(id, providerId, dto.enabled);
  }
}
