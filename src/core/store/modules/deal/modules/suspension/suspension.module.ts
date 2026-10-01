import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SuspensionController } from './suspension.controller';
import { SuspensionService } from './suspension.service';
import * as redisStore from 'cache-manager-redis-store';
import { EventModule } from '../events/event.module';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300,
      max: 1000,
    }),
    EventModule,
  ],
  controllers: [SuspensionController],
  providers: [SuspensionService],
  exports: [SuspensionService],
})
export class SuspensionModule {}
