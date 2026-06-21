import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsEnum,
} from 'class-validator';

export class SignatureZoneDto {
  @ApiProperty({ description: 'Numéro de page' })
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ description: 'Position X' })
  @IsNumber()
  x!: number;

  @ApiProperty({ description: 'Position Y' })
  @IsNumber()
  y!: number;

  @ApiProperty({ description: 'Largeur de la zone' })
  @IsNumber()
  width!: number;

  @ApiProperty({ description: 'Hauteur de la zone' })
  @IsNumber()
  height!: number;

  @ApiProperty({ description: 'Destinataire de la zone (client/provider)' })
  @IsEnum(['client', 'provider'])
  assignee!: string;
}

export class CreateContractDto {
  @ApiProperty({ description: 'ID du prestataire du service (fournisseur)' })
  @IsMongoId()
  @IsNotEmpty()
  providerId!: string;

  @ApiProperty({ description: 'ID du client du service (acheteur)' })
  @IsMongoId()
  @IsNotEmpty()
  clientId!: string;

  @ApiPropertyOptional({ description: 'ID du service associé dans le catalogue' })
  @IsMongoId()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'ID de l’événement associé' })
  @IsMongoId()
  @IsOptional()
  eventId?: string;

  @ApiProperty({ description: 'ID du document PDF d’origine' })
  @IsMongoId()
  @IsNotEmpty()
  templateDocumentId!: string;

  @ApiProperty({ description: 'Titre du contrat' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Termes et conditions détaillés du contrat' })
  @IsString()
  @IsNotEmpty()
  terms!: string;

  @ApiProperty({ description: 'Coût en points du service', example: 50 })
  @IsNumber()
  @Min(0)
  pricePoints!: number;

  @ApiPropertyOptional({ description: 'Zones de signature', type: [SignatureZoneDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignatureZoneDto)
  @IsOptional()
  signatureZones?: SignatureZoneDto[];
}

