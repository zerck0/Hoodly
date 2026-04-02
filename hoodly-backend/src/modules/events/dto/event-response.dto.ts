import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../schemas/event.schema';

export class LieuResponseDto {
  @ApiPropertyOptional({ description: 'Adresse' })
  adresse?: string;

  @ApiPropertyOptional({ description: 'Ville' })
  ville?: string;

  @ApiPropertyOptional({ description: 'Code postal' })
  codePostal?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  longitude?: number;
}

export class EventResponseDto {
  @ApiProperty({ description: 'ID MongoDB' })
  id!: string;

  @ApiProperty({ description: "Titre de l'événement" })
  titre!: string;

  @ApiProperty({ description: 'Catégorie' })
  categorie!: string;

  @ApiProperty({ description: "Date de l'événement" })
  date!: Date;

  @ApiProperty({ description: 'Lieu' })
  lieu!: LieuResponseDto;

  @ApiProperty({ description: 'Capacité' })
  capacite!: number;

  @ApiProperty({ description: 'Statut', enum: EventStatus })
  statut!: EventStatus;

  @ApiPropertyOptional({ description: 'Date de création' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Date de mise à jour' })
  updatedAt?: Date;
}
