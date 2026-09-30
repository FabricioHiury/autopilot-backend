import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  ErrorBadRequest,
  ErrorNotFound,
} from 'src/utils/errors/errors.swagger';
import { ListarFaqResposta } from './listar-faqs.swagger';

export class ObterFaqSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({ isArray: true })
  data: ListarFaqResposta;
}

export class ObterFaqErroBadRequest extends ErrorBadRequest {
  @ApiProperty({
    example: 'Parâmetros de consulta inválidos',
  })
  message: string;
}

export class ObterFaqErroNotFound extends ErrorNotFound {
  @ApiProperty({
    example: 'FAQ não encontrado',
  })
  message: string;
}
