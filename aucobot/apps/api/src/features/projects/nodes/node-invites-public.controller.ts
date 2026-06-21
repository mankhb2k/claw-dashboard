import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RedeemNodeInviteDto } from './dto/nodes.dto';
import { NodeInvitesService } from './services/node-invites/node-invites.service';

@ApiTags('nodes')
@Controller('nodes/invites')
export class NodeInvitesPublicController {
  constructor(private readonly invites: NodeInvitesService) {}

  @Post('redeem')
  redeem(@Body() dto: RedeemNodeInviteDto) {
    return this.invites.redeemInvite(dto.code);
  }
}
