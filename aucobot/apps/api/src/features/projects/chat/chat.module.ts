import { Module } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { UsageModule } from '../usage/usage.module';
import { ChatAgentsService } from './services/chat-agents/chat-agents.service';
import { ChatAttachmentsController } from './chat-attachments.controller';
import { ChatAttachmentsService } from './services/chat-attachments/chat-attachments.service';
import { ChatController } from './chat.controller';
import { ChatGatewayProxyService } from './services/chat-gateway-proxy/chat.gateway-proxy.service';
import { ChatModelService } from './services/chat-model/chat-model.service';
import { ChatWsRegistrar } from './lib/chat-ws/chat-ws.registrar';
import { chatAttachmentStorageProvider } from './storage/chat-attachment-storage.provider';
import { LocalChatAttachmentStorage } from './storage/local-chat-attachment.storage';

@Module({
  imports: [AuthModule, ProjectsModule, WorkspaceModule, AiProvidersModule, UsageModule],
  controllers: [ChatController, ChatAttachmentsController],
  providers: [
    ChatAgentsService,
    ChatAttachmentsService,
    ChatGatewayProxyService,
    ChatWsRegistrar,
    ChatModelService,
    LocalChatAttachmentStorage,
    chatAttachmentStorageProvider,
  ],
})
export class ChatModule {}
