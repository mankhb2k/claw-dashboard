import { Module } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { ChatAgentsService } from './chat-agents.service';
import { ChatAttachmentsController } from './chat-attachments.controller';
import { ChatAttachmentsService } from './chat-attachments.service';
import { ChatController } from './chat.controller';
import { ChatGatewayProxyService } from './chat.gateway-proxy.service';
import { ChatModelService } from './chat-model.service';
import { ChatWsRegistrar } from './chat-ws.registrar';
import { chatAttachmentStorageProvider } from './storage/chat-attachment-storage.provider';
import { LocalChatAttachmentStorage } from './storage/local-chat-attachment.storage';

@Module({
  imports: [AuthModule, ProjectsModule, WorkspaceModule, AiProvidersModule],
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
