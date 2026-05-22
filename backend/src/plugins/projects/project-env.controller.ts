import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../core/common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { DeleteProjectEnvDto, UpsertProjectEnvDto } from './dto/upsert-project-env.dto';
import { ProjectProviderKeysService } from './providers/project-provider-keys.service';
import { resolveProvider } from './providers/provider-registry';

@ApiTags('projects-env')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectEnvController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly providerKeys: ProjectProviderKeysService,
  ) {}

  @Get(':id/env')
  async listEnv(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerKeys.listMasked(id);
  }

  @Put(':id/env')
  async upsertEnv(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: UpsertProjectEnvDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    for (const entry of dto.env) {
      const provider = resolveProvider(entry.key);
      if (!provider) {
        continue;
      }
      await this.providerKeys.upsert({
        projectId: id,
        providerId: provider.id,
        apiKey: entry.value,
        enabled: false,
      });
      await this.providerKeys.testProvider(id, provider.id, { applyEnabled: true });
    }
    return { ok: true };
  }

  @Delete(':id/env')
  async deleteEnv(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: DeleteProjectEnvDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.providerKeys.deleteByEnvKey(id, dto.key);
    return { ok: true };
  }

  @Post(':id/provider-keys/:providerId/test')
  async testProviderKey(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerKeys.testProvider(id, providerId);
  }
}
