import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class FiltrosRotasListagem {
  @ApiProperty({ example: 'pesquisa' })
  @IsOptional()
  pesquisa: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  pagina: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  quantidade: number;

  @ApiProperty({ 
    example: "true", 
    description: "Define se devem ser exibidos apenas os chats onde o usuário é responsável pelo atendimento"
  })
  @IsBooleanString()
  @IsOptional()
  proprios?: string;

  @ApiProperty({ 
    example: "whatsapp", 
    description: "Filtrar por canal de origem (whatsapp, instagram, facebook, etc.)"
  })
  @IsOptional()
  canal?: string;

  @ApiProperty({ 
    example: "2024-01-01T00:00:00.000Z", 
    description: "Data de início do período para filtrar chats"
  })
  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @ApiProperty({ 
    example: "2024-12-31T23:59:59.999Z", 
    description: "Data de fim do período para filtrar chats"
  })
  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @ApiProperty({ 
    example: "recentes", 
    description: "Ordenação: 'recentes' (mais recentes primeiro), 'antigos' (mais antigos primeiro)"
  })
  @IsOptional()
  @IsIn(['recentes', 'antigos'])
  ordenacao?: string;

  @ApiProperty({ 
    example: "aguardando_resposta", 
    description: "Filtrar por status do chat: 'aguardando_resposta', 'em_aberto', 'finalizados', 'arquivados'"
  })
  @IsOptional()
  @IsIn(['aguardando_resposta', 'em_aberto', 'finalizados', 'arquivados'])
  statusChat?: string;

  @ApiProperty({ 
    example: "uuid-do-usuario", 
    description: "ID do usuário responsável pelo atendimento para filtrar chats específicos"
  })
  @IsOptional()
  idUsuarioResponsavel?: string;
}
