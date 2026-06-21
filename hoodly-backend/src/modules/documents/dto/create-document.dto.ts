import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId, IsEnum } from 'class-validator';
import { DocumentType } from '../schemas/document.schema';

export class CreateDocumentDto {
  @ApiProperty({ description: "ID de l'utilisateur propriétaire du document" })
  @IsMongoId()
  @IsNotEmpty()
  ownerId!: string;

  @ApiProperty({ description: 'Titre du document' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'URL sécurisée Cloudinary' })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @ApiProperty({ description: 'Hash cryptographique SHA-256' })
  @IsString()
  @IsNotEmpty()
  pdfHash!: string;

  @ApiProperty({ description: 'Type de document', enum: DocumentType })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type!: DocumentType;
}
