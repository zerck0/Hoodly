import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsNumber,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../schemas/event.schema';

export class LieuDto {
  @ApiPropertyOptional({ description: 'Adresse' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ description: 'Ville' })
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ description: 'Code postal' })
  @IsOptional()
  @IsString()
  codePostal?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CreateEventDto {
  @ApiProperty({ description: "Titre de l'événement" })
  @IsNotEmpty()
  @IsString()
  titre!: string;

  @ApiPropertyOptional({ description: "Description de l'événement" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Catégorie' })
  @IsNotEmpty()
  @IsString()
  categorie!: string;

  @ApiProperty({ description: "Date de l'événement" })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({ description: 'Lieu' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LieuDto)
  lieu!: LieuDto;

  @ApiProperty({ description: 'Capacité' })
  @IsNotEmpty()
  @IsNumber()
  capacite!: number;

  @ApiPropertyOptional({ description: 'Statut', enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  statut?: EventStatus;

  @ApiPropertyOptional({ description: 'Événement payant' })
  @IsOptional()
  payant?: boolean;

  @ApiPropertyOptional({ description: "Coût en points pour participer (si payant)" })
  @IsOptional()
  @IsNumber()
  pointsCout?: number;

  @ApiPropertyOptional({ description: 'Points gagnés par le créateur à la validation' })
  @IsOptional()
  @IsNumber()
  pointsCreateur?: number;

  @ApiPropertyOptional({ description: 'Points gagnés par chaque participant présent' })
  @IsOptional()
  @IsNumber()
  pointsParticipant?: number;

  @ApiPropertyOptional({ description: "URL de la photo de l'événement" })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: "ID du document PDF d'origine (charte/décharge)" })
  @IsOptional()
  @IsString()
  templateDocumentId?: string;
}

