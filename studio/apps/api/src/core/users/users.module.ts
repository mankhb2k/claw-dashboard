import { Module, forwardRef } from '@nestjs/common';

import { avatarStorageProvider } from './avatar/avatar-storage.provider';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, avatarStorageProvider],
  exports: [UsersService],
})
export class UsersModule {}
