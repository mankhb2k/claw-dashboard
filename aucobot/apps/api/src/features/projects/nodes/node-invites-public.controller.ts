import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NodeInvitesService } from './node-invites.service';
import { RedeemNodeInviteDto } from './dto/nodes.dto';

@ApiTags('nodes')
@Controller('nodes/invites')
export class NodeInvitesPublicController {
  constructor(private readonly invites: NodeInvitesService) {}

  @Post('redeem')
  redeem(@Body() dto: RedeemNodeInviteDto) {
    return this.invites.redeemInvite(dto.code);
  }
}
