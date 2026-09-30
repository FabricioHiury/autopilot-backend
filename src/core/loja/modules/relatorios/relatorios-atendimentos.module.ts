import { Module } from '@nestjs/common';
import { RelatoriosAtendimentosController } from './relatorios-atendimentos.controller';
import { RelatoriosAtendimentosService } from './relatorios-atendimentos.service';
import { PrismaModule } from 'src/persistence/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RelatoriosAtendimentosController],
  providers: [RelatoriosAtendimentosService],
  exports: [RelatoriosAtendimentosService],
})
export class RelatoriosAtendimentosModule {}