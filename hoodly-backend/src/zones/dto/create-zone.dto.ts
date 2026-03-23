import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  nom!: string;

  @IsString()
  @IsNotEmpty()
  ville!: string;

  @IsOptional()
  @IsObject()
  polygone?: {
    type: string;
    coordinates: number[][][];
  };
}
