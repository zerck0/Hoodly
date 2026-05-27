import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SignContractDto {
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
