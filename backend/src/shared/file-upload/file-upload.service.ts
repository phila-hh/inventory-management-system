import { Injectable } from '@nestjs/common';

@Injectable()
export class FileUploadService {

  async uploadFile(file: Express.Multer.File): Promise<string> {
    return `/uploads/${file.filename}`;
  }
}