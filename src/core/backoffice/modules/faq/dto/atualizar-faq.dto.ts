import { PartialType } from '@nestjs/mapped-types';
import { CriarFaqDto } from './criar-faq.dto';

export class AtualizarFaqDto extends PartialType(CriarFaqDto) {}
