import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { getFirebaseConfig } from 'src/config/firebase.config';
import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { Bucket } from '@google-cloud/storage';

@Injectable()
export class FirebaseService {
  private storageBucket?: Bucket;

  private get bucket(): Bucket {
    if (this.storageBucket) return this.storageBucket;
    if (!admin.apps.length) {
      const firebaseConfig = getFirebaseConfig();
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.project_id,
          clientEmail: firebaseConfig.client_email,
          privateKey: firebaseConfig.private_key,
        }),
        storageBucket: firebaseConfig.project_id + '.firebasestorage.app',
      });
    }

    this.storageBucket = getStorage().bucket();
    return this.storageBucket;
  }

  async uploadFile(file: Express.Multer.File): Promise<string[]> {
    const folder = this.getFolderByMimeType(file.mimetype);
    const key = `${folder}/${uuidv4()}_${file.originalname}`;

    try {
      const fileUpload = this.bucket.file(key);

      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
        resumable: false,
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          reject(
            new Error(
              'Failed to perform o upload for the Firebase: ' + error.message,
            ),
          );
        });

        stream.on('finish', async () => {
          await fileUpload.makePublic();

          const url = await this.fileUrl(key);
          resolve([key, url]);
        });

        stream.end(file.buffer);
      });
    } catch (error) {
      throw new Error(
        'Failed to perform o upload for the Firebase: ' + error.message,
      );
    }
  }

  async fileUrl(key: string): Promise<string> {
    try {
      const file = this.bucket.file(key);
      const [exists] = await file.exists();

      if (!exists) {
        throw new Error('File not found');
      }

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 24 * 365 * 10 * 1000, // 10 years at milissegundos
      });

      return url;
    } catch (error) {
      throw new Error(
        'Failed to get URL of file of Firebase: ' + error.message,
      );
    }
  }

  async deleteFile(key: string): Promise<{}> {
    try {
      const file = this.bucket.file(key);
      await file.delete();
      return { key };
    } catch (error) {
      throw new Error('Failed to delete file of Firebase: ' + error.message);
    }
  }

  async deletePath(key: string): Promise<boolean> {
    try {
      const file = this.bucket.file(key);
      await file.delete();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    try {
      const file = this.bucket.file(key);
      const [exists] = await file.exists();

      if (!exists) {
        throw new Error('File not found');
      }

      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      throw new Error('Failed to get file of Firebase: ' + error.message);
    }
  }

  async getUploadFileUrl(key: string): Promise<string> {
    try {
      const file = this.bucket.file(key);

      const [url] = await file.getSignedUrl({
        action: 'write',
        expires: Date.now() + 5 * 1000, // 5 segundos at milissegundos
        contentType: 'application/octet-stream',
      });

      return url;
    } catch (error) {
      throw new Error('Failed to get URL of Firebase: ' + error.message);
    }
  }

  private async streamToBuffer(
    stream: Readable | ReadableStream,
  ): Promise<Buffer> {
    if (stream instanceof Readable) {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } else {
      const reader = stream.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    }
  }

  private getFolderByMimeType(mimetype: string): string {
    // Áudio
    if (mimetype.startsWith('audio/')) {
      return 'Audio';
    }

    // Vídeo
    if (mimetype.startsWith('video/')) {
      return 'Video';
    }

    // Fotos/Imagens
    if (mimetype.startsWith('image/')) {
      return 'Fotos';
    }

    // Documentos (all os other types)
    const documentTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/vnd.rar',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/x-bzip2',
    ];

    if (
      documentTypes.includes(mimetype) ||
      mimetype.startsWith('application/') ||
      mimetype.startsWith('text/')
    ) {
      return 'Documentos';
    }

    // Fallback for documentos se não identificar o type
    return 'Documentos';
  }
}
