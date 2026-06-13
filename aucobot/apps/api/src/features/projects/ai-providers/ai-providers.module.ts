import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProviderKeysController } from './provider-keys.controller';
import { ProvidersCatalogController } from './providers-catalog.controller';
import { ProviderKeysService } from './services/provider-keys/provider-keys.service';
import { ProviderModelsService } from './services/provider-models/provider-models.service';

@Module({
  imports: [AuthModule, WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [ProviderKeysController, ProvidersCatalogController],
  providers: [ProviderKeysService, ProviderModelsService],
  exports: [ProviderKeysService, ProviderModelsService],
})
export class AiProvidersModule {}
