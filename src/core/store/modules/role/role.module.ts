import { Module } from '@nestjs/common';
import { StoreRoleController } from './role.controller';
import { StoreRoleService } from './role.service';

@Module({
  controllers: [StoreRoleController],
  providers: [StoreRoleService],
})
export class StoreRoleModule {}
