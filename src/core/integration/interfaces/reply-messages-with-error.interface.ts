import { MessageWithError } from './message-with-error.interface';

export interface ReplyMessagesWithError {
  message: string;
  statusCode: number;
  data: MessageWithError[];
}
