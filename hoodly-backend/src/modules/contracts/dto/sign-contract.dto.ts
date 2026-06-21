import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class SignContractDto {
  @ApiProperty({
    description: 'Code de vérification OTP à 6 chiffres envoyé par e-mail',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp!: string;

  @ApiProperty({
    description: 'Image de la signature manuscrite dessinée (Base64)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAy...',
  })
  @IsString()
  @IsNotEmpty()
  signatureImage!: string;

  @ApiProperty({
    description:
      'Métadonnées de la signature numérique (ex: User-Agent du navigateur, OS)',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsString()
  @IsNotEmpty()
  signatureMetadata!: string;

  @ApiPropertyOptional({
    description:
      'Adresse IP du signataire (optionnel, récupéré de la requête sinon)',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

