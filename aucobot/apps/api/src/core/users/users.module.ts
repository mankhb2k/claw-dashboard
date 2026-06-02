import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { avatarStorageProvider } from './avatar/avatar-storage.provider';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, avatarStorageProvider],
  exports: [UsersService],
})
export class UsersModule {}
