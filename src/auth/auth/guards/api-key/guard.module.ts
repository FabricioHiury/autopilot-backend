import { Module, Global } from '@nestjs/common';
import { ApiKeyService } from './guard.service';

@Global()
@Module({
  providers: [ApiKeyService],
  exports: [ApiKeyService],
})
export class GuardModule {}
