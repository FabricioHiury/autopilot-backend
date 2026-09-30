import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from 'src/persistence/database/prisma/prisma.module';
import { MailModule } from 'src/utils/mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { GuardModule } from './guards/api-key/guard.module';

@Global()
@Module({
  imports: [
    GuardModule,
    PrismaModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
