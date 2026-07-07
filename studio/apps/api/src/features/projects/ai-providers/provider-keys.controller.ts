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

import { SaveKeyDto, SetEnabledDto } from './dto/key.dto';
import {
  AddProviderModelDto,
  UpdateProviderModelDto,
} from './dto/provider-model.dto';
import { ProjectsService } from '../services/projects/projects.service';
import { ProviderKeysService } from './services/provider-keys/provider-keys.service';
import { ProviderModelsService } from './services/provider-models/provider-models.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';

@ApiTags('projects-provider-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProviderKeysController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly providerKeys: ProviderKeysService,
    private readonly providerModels: ProviderModelsService,
  ) {}

  @Get(':id/provider-keys')
  async list(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerKeys.listMasked(id);
  }

  @Get(':id/provider-keys/:providerId/reveal')
  async reveal(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerKeys.revealApiKey(id, providerId);
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

  @Get(':id/provider-keys/:providerId/models')
  async listModels(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerModels.list(id, providerId);
  }

  @Post(':id/provider-keys/:providerId/models')
  async addModel(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
    @Body() dto: AddProviderModelDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerModels.add({
      projectId: id,
      providerId,
      openclawId: dto.openclawId,
      displayName: dto.displayName,
      setDefault: dto.setDefault,
    });
  }

  @Patch(':id/provider-keys/:providerId/models/:modelId')
  async updateModel(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
    @Param('modelId') modelId: string,
    @Body() dto: UpdateProviderModelDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.providerModels.update({
      projectId: id,
      providerId,
      modelId,
      displayName: dto.displayName,
      setDefault: dto.setDefault,
    });
  }

  @Delete(':id/provider-keys/:providerId/models/:modelId')
  async deleteModel(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Param('providerId') providerId: string,
    @Param('modelId') modelId: string,
  ) {
    await this.projects.assertOwned(user.sub, id);
    await this.providerModels.delete(id, providerId, modelId);
    return { ok: true };
  }
}
