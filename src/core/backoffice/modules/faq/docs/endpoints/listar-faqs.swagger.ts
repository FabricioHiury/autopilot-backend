import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ErrorBadRequest } from 'src/utils/errors/errors.swagger';

export class ListarFaqResposta {
  @ApiProperty({ example: 55 })
  id: string;

  @ApiProperty({ example: 'Você tem problema na versão 2' })
  titulo: string;

  @ApiProperty({ example: 'contas' })
  categoria: string;

  @ApiProperty({ example: 'publicado' })
  status: string;

  @ApiProperty({
    example:
      'Comprar um veículo é uma decisão importante que requer planejamento e pesquisa. Neste artigo, aborda...',
  })
  resumo: string;

  @ApiProperty({ example: 0 })
  views: number;

  @ApiProperty({ example: '2024-12-04T23:45:05.442Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-12-04T23:45:05.442Z' })
  atualizadoEm: Date;

  @ApiProperty({ example: ['novo', 'veículo', 'compra'] })
  tags: string[];
}

export class ListarFaqSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({})
  data: ListarFaqResposta;
}

export class ListarFaqsErroBadRequest extends ErrorBadRequest {
  @ApiProperty({
    example: 'Parâmetros de consulta inválidos',
  })
  message: string;
}
