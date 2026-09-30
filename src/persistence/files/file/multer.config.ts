import { MulterModuleOptions, MulterOptionsFactory } from '@nestjs/platform-express';
import * as multer from 'multer';

export class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      storage: multer.memoryStorage()
    };
  }
}