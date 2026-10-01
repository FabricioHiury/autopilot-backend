import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/auth/guards/api-key/api-key.guard';
import { IngestionService } from './ingestion.service';
import { IncomingEventDto, MessageAckDto } from './incoming.dto';
@Controller()
@UseGuards(ApiKeyGuard)
export class CommunicationController {
  constructor(private readonly ingestion: IngestionService) {}
  @Post('chat/messages/incoming')
  @HttpCode(202)
  incoming(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    input: IncomingEventDto,
  ) {
    return this.ingestion.accept(input);
  }
  @Post('leads/incoming')
  @HttpCode(202)
  lead(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    input: IncomingEventDto,
  ) {
    return this.ingestion.accept(input, 'lead');
  }
  @Post('chat/messages/ack')
  acknowledge(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    input: MessageAckDto,
  ) {
    return this.ingestion.acknowledge(input);
  }
}
