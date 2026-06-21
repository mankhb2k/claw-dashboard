import { BadRequestException } from '@nestjs/common';

import {
  GatewayConfigError,
  isOssRuntime,
  type GatewayEndpoint,
} from '@aucobot/runtime-contracts';
import {
  httpBaseToWsBase,
  resolveOssGatewayEndpoint,
  resolveOssGatewayHttpBase,
  resolveOssGatewayToken,
} from '@aucobot/runtime-oss';

import type { Project } from '@aucobot/database';

export type { GatewayEndpoint } from '@aucobot/runtime-contracts';
export { resolveOssGatewayHttpBase, resolveOssGatewayToken, httpBaseToWsBase };

const CLOUD_RUNTIME_MSG = 'Cloud runtime is not configured in this build';

type ProjectGatewayPick = Pick<Project, 'gatewayToken'>;

/** OSS: env token first, then project.gatewayToken from DB. */
export function resolveGatewayEndpoint(
  project?: ProjectGatewayPick,
): GatewayEndpoint {
  try {
    if (isOssRuntime()) {
      return resolveOssGatewayEndpoint(project);
    }
    throw new GatewayConfigError(CLOUD_RUNTIME_MSG);
  } catch (err) {
    if (err instanceof GatewayConfigError) {
      throw new BadRequestException(err.message);
    }
    throw err;
  }
}
