import { PartialType } from '@nestjs/swagger';
import { CriarVisitaDto } from './criar-visita.dto';

export class EditarTarefaDto extends PartialType(CriarVisitaDto) {}
