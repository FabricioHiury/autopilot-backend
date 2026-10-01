import { Global, Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './multer.config';
import { PrismaModule } from 'src/persistence/database/prisma/prisma.module';

@Global()
@Module({
  imports: [
    FirebaseModule,
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
    PrismaModule,
  ],
  providers: [FileService, MulterConfigService],
  exports: [FileService],
})
export class FileModule {}
