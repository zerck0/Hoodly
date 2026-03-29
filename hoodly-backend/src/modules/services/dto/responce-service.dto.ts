import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, ServiceStatus } from '../schemas/service.schema';

export class ServiceResponseDto {
  @ApiProperty({ description: 'ID MongoDB' })
  id!: string;

  @ApiProperty({ description: 'Titre du service' })
  titre!: string;

  @ApiProperty({ description: 'Description détaillée' })
  description!: string;

  @ApiProperty({ description: 'Type de service', enum: ServiceType })
  type!: ServiceType;

  @ApiProperty({ description: 'Catégorie du service' })
  categorie!: string;

  @ApiProperty({ description: 'Service gratuit' })
  gratuit!: boolean;

  @ApiPropertyOptional({ description: 'Nombre de points' })
  points?: number;

  @ApiProperty({ description: 'Statut', enum: ServiceStatus })
  statut!: ServiceStatus;

  @ApiProperty({ description: 'Créateur du service' })
  createurId!: string;

  @ApiProperty({ description: 'Zone du service' })
  zoneId!: string;

  @ApiPropertyOptional({ description: 'Répondant' })
  respondeId?: string;

  @ApiPropertyOptional({ description: 'ID du contrat' })
  contractId?: string;

  @ApiPropertyOptional({ description: 'URL de la photo' })
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Date de création' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Date de mise à jour' })
  updatedAt?: Date;
}
