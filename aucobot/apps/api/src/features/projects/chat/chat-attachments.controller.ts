import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { ProjectsService } from '../projects.service';
import { ChatAttachmentsService } from './chat-attachments.service';

@ApiTags('chat-attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ChatAttachmentsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly attachments: ChatAttachmentsService,
  ) {}

  @Post(':id/chat/attachments')
  @ApiConsumes('multipart/form-data')
  async upload(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') projectId: string,
    @Req() req: FastifyRequest,
  ) {
    await this.projects.assertOwned(user.sub, projectId);
    return this.attachments.upload(projectId, user.sub, req);
  }

  @Get(':id/chat/attachments/:attachmentId')
  async download(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') projectId: string,
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: false }) reply: FastifyReply,
  ) {
    await this.projects.assertOwned(user.sub, projectId);
    const file = await this.attachments.readForDownload(
      projectId,
      attachmentId,
      user.sub,
    );
    return reply
      .header('Content-Type', file.mimeType)
      .header(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(file.originalName)}"`,
      )
      .header('Cache-Control', 'private, max-age=3600')
      .send(file.buffer);
  }

  @Delete(':id/chat/attachments/:attachmentId')
  async remove(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') projectId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    await this.projects.assertOwned(user.sub, projectId);
    return this.attachments.deletePending(projectId, attachmentId, user.sub);
  }
}
