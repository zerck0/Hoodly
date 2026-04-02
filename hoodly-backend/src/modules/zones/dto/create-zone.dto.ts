import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({ description: 'Nom du quartier' })
  @IsString()
  @IsNotEmpty()
  nom!: string;

  @ApiProperty({ description: 'Ville' })
  @IsString()
  @IsNotEmpty()
  ville!: string;

  @ApiProperty({ description: 'Polygone GeoJSON' })
  @IsObject()
  @IsNotEmpty()
  polygone!: {
    type: string;
    coordinates: number[][][];
  };
}
