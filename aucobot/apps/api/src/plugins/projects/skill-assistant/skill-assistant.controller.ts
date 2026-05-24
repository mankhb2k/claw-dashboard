import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../../core/common/decorators/current-user.decorator';
import { SkillAssistantCompleteDto } from '../dto/skill-assistant.dto';
import { ProjectsService } from '../projects.service';
import { SkillAssistantService } from './skill-assistant.service';

@ApiTags('projects-skill-assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class SkillAssistantController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly assistant: SkillAssistantService,
  ) {}

  @Get(':id/skill-assistant/options')
  async options(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.assistant.listOptions(id);
  }

  @Post(':id/skill-assistant/complete')
  async complete(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: SkillAssistantCompleteDto,
  ) {
    await this.projects.assertOwned(user.sub, id);
    return this.assistant.complete({
      projectId: id,
      providerId: dto.providerId,
      model: dto.model,
      messages: dto.messages,
      skillContext: dto.skillContext,
    });
  }
}
