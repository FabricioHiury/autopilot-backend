import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListStoresAdminSuccess } from './endpoints/list-stores.swagger';
import { ConfigureIntegrationWppSuccess } from './endpoints/configure-integration-wpp.swagger';
import { ConfigureIntegrationWppDto } from '../dto/configure-integration-whatsapp.dto';

const description = `Requires token of authentication of a user with profile "autopilot".`;

export function ListStoresAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `List all the stores cadastradas`,
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListStoresAdminSuccess,
    }),
  );
}

export function ConfigureIntegrationWppDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Configura a integration with whatsapp for a store`,
      description:
        description +
        ' After a configuration, the store at question is enabled for get o QR Code of authentication and start and send and receive messages',
    }),

    ApiBody({ type: ConfigureIntegrationWppDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ConfigureIntegrationWppSuccess,
    }),

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
    }),
  );
}
