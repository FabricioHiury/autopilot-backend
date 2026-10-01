import { Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
@Injectable()
export class ApiKeyService {
  validateApiKey(apiKey: string): boolean {
    const expected = process.env.MICROSERVICE_TOKEN || process.env.API_KEY;
    if (!expected || typeof apiKey !== 'string') return false;
    const a = Buffer.from(apiKey),
      b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
