import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { MicroserviceSocket } from './microservice.socket';
import { CommunicationController } from './communication.controller';
@Module({
  controllers: [CommunicationController],
  providers: [IngestionService, MicroserviceSocket],
})
export class CommunicationModule {}
