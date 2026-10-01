import { IntegrationsEnum } from 'src/core/store/modules/chat/enum/channel.enum';

export interface MessageWithError {
  id: string;
  storeId: string;
  message: string;
  email: string;
  mobile: string;
  attachmentUrl: string;
  avatarUrl: string;
  messageId: string;
  channel: IntegrationsEnum;
  externalRecipientId: string;
  timestamp: Date;
  error: string;
  status: number;
  retryCount: number;
  code: string;
}
