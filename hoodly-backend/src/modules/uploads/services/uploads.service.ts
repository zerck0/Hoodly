/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
    });
  }

  async uploadFile(file: UploadedFile): Promise<string> {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'hoodly',
            resource_type: 'auto',
          },
          (error, response) => {
            if (error) reject(error);
            else resolve(response as UploadApiResponse);
          },
        )
        .end(file.buffer);
    });

    return result.secure_url;
  }

  async downloadFile(fileUrl: string): Promise<Buffer> {
    const urlObj = new URL(fileUrl);
    const pathParts = urlObj.pathname.split('/');
    const uploadIdx = pathParts.findIndex((p) => p === 'upload' || p === 'raw');
    if (uploadIdx === -1) {
      const res = await fetch(fileUrl);
      if (!res.ok)
        throw new Error(`Impossible de télécharger le fichier (${res.status})`);
      return Buffer.from(await res.arrayBuffer());
    }

    const detectedResourceType = pathParts[uploadIdx - 1] || 'image';

    let version: string | undefined;
    const versionPart = pathParts[uploadIdx + 1];
    if (
      versionPart &&
      versionPart.startsWith('v') &&
      /^\d+$/.test(versionPart.slice(1))
    ) {
      version = versionPart.slice(1);
    }

    let publicIdParts = pathParts.slice(uploadIdx + 1);
    if (publicIdParts[0]?.match(/^v\d+$/)) {
      publicIdParts = publicIdParts.slice(1);
    }
    const ext = publicIdParts[publicIdParts.length - 1]?.split('.').pop() || '';
    const publicIdWithExt = publicIdParts.join('/');
    const publicId = ext
      ? publicIdWithExt.replace(new RegExp(`\\.${ext}$`), '')
      : publicIdWithExt;

    const signedUrl = cloudinary.url(publicId, {
      resource_type: detectedResourceType,
      type: 'upload',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 60,
      version: version || undefined,
      format: ext || undefined,
    });

    const res = await fetch(signedUrl);
    if (!res.ok) {
      const fallback = await fetch(fileUrl);
      if (!fallback.ok)
        throw new Error(
          `Impossible de télécharger le PDF modèle (${fallback.status})`,
        );
      return Buffer.from(await fallback.arrayBuffer());
    }
    return Buffer.from(await res.arrayBuffer());
  }
}
