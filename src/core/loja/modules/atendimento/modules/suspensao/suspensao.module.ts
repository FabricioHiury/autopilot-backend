import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SuspensaoController } from './suspensao.controller';
import { SuspensaoService } from './suspensao.service';
import * as redisStore from 'cache-manager-redis-store';
import { EventoModule } from '../eventos/evento.module';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300, 
      max: 1000,
    }),
    EventoModule,
  ],
  controllers: [SuspensaoController],
  providers: [SuspensaoService],
  exports: [SuspensaoService],
})
export class SuspensaoModule {}