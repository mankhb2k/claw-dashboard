import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { AssistantCompleteDto } from './dto/assistant.dto';
import { ProjectsService } from '../projects.service';
import { SkillAiEditorService } from './skill-ai-editor.service';

@ApiTags('skill-ai-editor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class SkillAiEditorController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly editor: SkillAiEditorService,
  ) {}

  @Get(':id/skill-ai-editor/options')
  async options(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.editor.listOptions(id);
  }

  @Post(':id/skill-ai-editor/complete')
  async complete(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: AssistantCompleteDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.editor.complete({
      projectId: id,
      providerId: dto.providerId,
      model: dto.model,
      messages: dto.messages,
      skillContext: dto.skillContext,
    });
  }
}
