import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'OpenClaw SaaS API';
  }

  getHealth() {
    return {
      status: 'healthy',
      time: new Date().toISOString(),
    }
  }
}
