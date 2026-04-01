import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateZoneDto {
  @ApiPropertyOptional({ description: 'Nom du quartier' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @ApiPropertyOptional({ description: 'Ville' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ville?: string;

  @ApiPropertyOptional({ description: 'Polygone GeoJSON' })
  @IsOptional()
  @IsObject()
  polygone?: {
    type: string;
    coordinates: number[][][];
  };

  @ApiPropertyOptional({ description: 'Statut de la zone' })
  @IsOptional()
  @IsString()
  statut?: string;
}
