import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsEnum(IncidentStatus)
  statut?: IncidentStatus;

  @IsOptional()
  @IsEnum(IncidentPriority)
  priorite?: IncidentPriority;

  @IsOptional()
  @IsString()
  signaledPar?: string;

  @IsOptional()
  @IsMongoId()
  zoneId?: string;
}
