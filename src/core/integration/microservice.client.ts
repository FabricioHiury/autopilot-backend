import axios, { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';
@Injectable()
export class MicroserviceClientService {
  readonly http: AxiosInstance;
  constructor() {
    this.http = axios.create({
      baseURL: process.env.MICROSERVICE_URL || process.env.API_BASE_URL,
      headers: {
        'x-micro-token': process.env.MICROSERVICE_TOKEN || process.env.API_KEY,
      },
      timeout: 10000,
    });
  }
}
