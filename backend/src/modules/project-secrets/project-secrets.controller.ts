import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../../core/common/decorators/current-user.decorator';
import { ProjectSecretsService } from './project-secrets.service';
import { UpsertSecretDto } from './dto/upsert-secret.dto';

@ApiTags('project-secrets')
@Controller('projects/:projectId/secrets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectSecretsController {
  constructor(private readonly secrets: ProjectSecretsService) {}

  @Get()
  listKeys(@CurrentUser() u: JwtPayloadUser, @Param('projectId') projectId: string) {
    return this.secrets.listKeys(u.sub, projectId);
  }

  @Get(':secretKey')
  getOne(
    @CurrentUser() u: JwtPayloadUser,
    @Param('projectId') projectId: string,
    @Param('secretKey') secretKey: string,
  ) {
    return this.secrets.getDecrypted(u.sub, projectId, decodeURIComponent(secretKey));
  }

  @Put(':secretKey')
  upsert(
    @CurrentUser() u: JwtPayloadUser,
    @Param('projectId') projectId: string,
    @Param('secretKey') secretKey: string,
    @Body() dto: UpsertSecretDto,
  ) {
    return this.secrets.upsert(u.sub, projectId, decodeURIComponent(secretKey), dto);
  }

  @Delete(':secretKey')
  remove(
    @CurrentUser() u: JwtPayloadUser,
    @Param('projectId') projectId: string,
    @Param('secretKey') secretKey: string,
  ) {
    return this.secrets.remove(u.sub, projectId, decodeURIComponent(secretKey));
  }
}
