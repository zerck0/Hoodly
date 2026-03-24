import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ description: "Type d'incident" })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

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
}
