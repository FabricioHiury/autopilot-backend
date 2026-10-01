import { Controller, Get, UseGuards } from '@nestjs/common';
import { HistoryStoreService } from './history-store.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { ListHistoryStoreDto } from './dto/list-history-store.dto';
import { ApiTags } from '@nestjs/swagger';
import { ListHistoryStoreDoc } from './docs/history-store.swagger';

@ApiTags('History store')
@UseGuards(JwtAuthGuard)
@Controller('history-store')
export class HistoryStoreController {
  constructor(private readonly historyStoreService: HistoryStoreService) {}

  @ListHistoryStoreDoc()
  @Get('/')
  listHistoryStore(@StoreId() storeId: string, params: ListHistoryStoreDto) {
    return this.historyStoreService.listHistoryStore(storeId, params);
  }
}
