import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';

export class CreateIncidentDto {
  @ApiProperty({ description: "Type d'incident" })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: 'URL de la photo' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Statut', enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  statut?: IncidentStatus;

  @ApiPropertyOptional({ description: 'Priorité', enum: IncidentPriority })
  @IsOptional()
  @IsEnum(IncidentPriority)
  priorite?: IncidentPriority;

  @ApiPropertyOptional({ description: 'ID du signaleur' })
  @IsOptional()
  @IsString()
  signaledPar?: string;

  @ApiPropertyOptional({ description: 'ID de la zone' })
  @IsOptional()
  @IsMongoId()
  zoneId?: string;
}
