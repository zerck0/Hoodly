import { IsEnum, IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentStatus } from '../enums/incident-status.enum';

export class UpdateIncidentStatutDto {
  @ApiProperty({ description: 'Nouveau statut', enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  statut!: IncidentStatus;

  @ApiPropertyOptional({ description: "ID de l'utilisateur assigné" })
  @IsOptional()
  @IsMongoId()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Commentaire de résolution' })
  @IsOptional()
  @IsString()
  resolutionComment?: string;
}
