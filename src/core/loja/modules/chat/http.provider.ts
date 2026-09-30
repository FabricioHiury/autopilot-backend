import axios from 'axios';
import * as http from 'http';
import * as https from 'https';

export const ApiHttpProvider = {
  provide: 'API_HTTP',
  useFactory: () => axios.create({
    baseURL: process.env.API_BASE_URL,
    headers: { 'x-micro-token': process.env.API_KEY },
    timeout: 10000,
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
  }),
};
