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

  @ApiProperty({ description: 'ID du créateur' })
  createurId!: string;

  @ApiProperty({ description: "Titre de l'événement" })
  titre!: string;

  @ApiPropertyOptional({ description: "Description de l'événement" })
  description?: string;

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

  @ApiProperty({ description: 'Utilisateurs intéressés (IDs)' })
  interesses!: string[];

  @ApiProperty({ description: 'Participants (IDs)' })
  participants!: string[];

  @ApiPropertyOptional({ description: 'Participants (objets peuplés)' })
  participantsFull?: { id: string; name: string; picture?: string }[];

  @ApiProperty({ description: 'Événement payant' })
  payant!: boolean;

  @ApiPropertyOptional({ description: "Coût en points pour participer" })
  pointsCout?: number;

  @ApiProperty({ description: 'Points gagnés par le créateur à la validation' })
  pointsCreateur!: number;

  @ApiProperty({ description: 'Points gagnés par chaque participant présent' })
  pointsParticipant!: number;

  @ApiProperty({ description: 'IDs des participants présents après validation' })
  participantsPresents!: string[];

  @ApiPropertyOptional({ description: "URL de la photo de l'événement" })
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'ID de la discussion de groupe' })
  conversationId?: string;

  @ApiPropertyOptional({ description: "ID du document PDF d'origine (charte/décharge)" })
  templateDocumentId?: string;

  @ApiPropertyOptional({ description: 'Date de création' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Date de mise à jour' })
  updatedAt?: Date;
}

