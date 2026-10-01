import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListHistoryStoreSuccess } from './endpoints/list-history-store';

export function ListHistoryStoreDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `List history of events of a store`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListHistoryStoreSuccess,
    }),
  );
}
