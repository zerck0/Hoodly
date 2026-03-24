import { IsString, IsOptional, IsEnum } from 'class-validator';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';

export class UpdateIncidentDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsEnum(IncidentStatus)
  statut?: IncidentStatus;

  @IsOptional()
  @IsEnum(IncidentPriority)
  priorite?: IncidentPriority;
}
