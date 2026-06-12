import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspace/workspace.module';
import { GatewayUsageSubscriberService } from './services/gateway-usage-subscriber/gateway-usage-subscriber.service';
import { ModelUsageRecorderService } from './services/model-usage-recorder/model-usage-recorder.service';

@Module({
  imports: [WorkspaceModule],
  providers: [ModelUsageRecorderService, GatewayUsageSubscriberService],
  exports: [ModelUsageRecorderService, GatewayUsageSubscriberService],
})
export class UsageModule {}
