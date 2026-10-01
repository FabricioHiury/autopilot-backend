import { CustomizationModule } from './modules/customization/customization.module';
import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreRoleModule } from './modules/role/role.module';
import { DealModule } from './modules/deal/deal.module';
import { ChatModule } from './modules/chat/chat.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { CustomerModule } from './modules/customer/customer.module';
import { HistoryStoreModule } from './modules/history/history-store.module';
import { StoreDashboardModule } from './modules/dashboard/store-dashboard.module';
import { AvatarExternalModule } from './modules/avatar-external/avatar-external.module';
import { ReportsDealsModule } from './modules/reports/reports-deals.module';
import { MessagesTemplatesModule } from './modules/messages-templates/messages-templates.module';

@Module({
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
  imports: [
    CustomizationModule,
    StoreRoleModule,
    DealModule,
    ChatModule,
    EmployeeModule,
    CustomerModule,
    HistoryStoreModule,
    StoreDashboardModule,
    AvatarExternalModule,
    ReportsDealsModule,
    MessagesTemplatesModule,
  ],
})
export class StoreModule {}
