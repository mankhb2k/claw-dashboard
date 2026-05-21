import { Module } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { ChatAgentsService } from './chat-agents.service';
import { ChatController } from './chat.controller';
import { ChatGatewayProxyService } from './chat.gateway-proxy.service';
import { ChatWsRegistrar } from './chat-ws.registrar';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [ChatController],
  providers: [ChatAgentsService, ChatGatewayProxyService, ChatWsRegistrar],
})
export class ChatModule {}
