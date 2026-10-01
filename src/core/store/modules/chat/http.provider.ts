import { MicroserviceClientService } from 'src/core/integration/microservice.client';
export const ApiHttpProvider = {
  provide: 'API_HTTP',
  useFactory: () => new MicroserviceClientService().http,
};
