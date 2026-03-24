import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({ description: 'Nom du quartier' })
  @IsString()
  @IsNotEmpty()
  nom!: string;

  @ApiProperty({ description: 'Ville' })
  @IsString()
  @IsNotEmpty()
  ville!: string;

  @ApiPropertyOptional({ description: 'Polygone GeoJSON' })
  @IsOptional()
  @IsObject()
  polygone?: {
    type: string;
    coordinates: number[][][];
  };
}
