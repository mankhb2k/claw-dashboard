import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      ok: true,
      phase: '1',
      service: 'openclaw-control-plane',
    };
  }
}
