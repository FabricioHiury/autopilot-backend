import { Module } from '@nestjs/common';
import { ReportsDealsController } from './reports-deals.controller';
import { ReportsDealsService } from './reports-deals.service';
import { PrismaModule } from 'src/persistence/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsDealsController],
  providers: [ReportsDealsService],
  exports: [ReportsDealsService],
})
export class ReportsDealsModule {}
