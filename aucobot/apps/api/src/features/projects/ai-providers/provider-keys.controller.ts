import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../../core/common/decorators/current-user.decorator';
import { SaveKeyDto, SetEnabledDto } from './dto/key.dto';
import { ProjectsService } from '../projects.service';
import { ProviderKeysService } from './provider-keys.service';

@ApiTags('projects-provider-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProviderKeysController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly providerKeys: ProviderKeysService,
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
    @Body() dto: SaveKeyDto,
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
    @Body() dto: SetEnabledDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerKeys.setEnabled(id, providerId, dto.enabled);
  }

  @Post(':id/provider-keys/:providerId/test')
  async test(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerKeys.testProvider(id, providerId);
  }

  @Delete(':id/provider-keys/:providerId')
  async delete(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.providerKeys.deleteByProviderId(id, providerId);
    return { ok: true };
  }
}
