import { TYPES_EVENT_STORE } from '../enum/history-store.enum';

export interface IHistoryStoreDto {
  storeId: string;
  typeEvent: TYPES_EVENT_STORE;
  description: string;
}
