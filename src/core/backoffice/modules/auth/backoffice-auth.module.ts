import { Module } from '@nestjs/common';
import { BackofficeAuthController } from './backoffice-auth.controller';
import { AuthModule } from 'src/auth/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BackofficeAuthController],
})
export class BackofficeAuthModule {}
