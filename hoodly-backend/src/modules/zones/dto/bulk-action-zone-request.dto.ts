import { IsArray, IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkActionZoneRequestDto {
  @ApiProperty({ description: 'Tableau des IDs de demandes' })
  @IsArray()
  @IsString({ each: true })
  requestIds!: string[];

  @ApiProperty({ description: 'Nom du quartier à créer' })
  @IsString()
  @IsNotEmpty()
  nomQuartier!: string;

  @ApiProperty({ description: 'Ville' })
  @IsString()
  @IsNotEmpty()
  ville!: string;

  @ApiProperty({ description: 'Périmètre du quartier (GeoJSON Polygon)' })
  @IsObject()
  @IsNotEmpty()
  polygone!: {
    type: string;
    coordinates: number[][][];
  };

  @ApiProperty({ description: 'Commentaire optionnel' })
  @IsString()
  @IsOptional()
  commentaire?: string;
}
