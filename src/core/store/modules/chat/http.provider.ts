import { MicroserviceClientService } from 'src/core/integration/microservice.client';
export const ApiHttpProvider = {
  provide: 'API_HTTP',
  useFactory: (): AxiosInstance => new MicroserviceClientService().http,
};
import type { AxiosInstance } from 'axios';
