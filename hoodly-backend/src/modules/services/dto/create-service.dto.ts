import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsMongoId,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, ServiceStatus } from '../schemas/service.schema';

export class CreateServiceDto {
  @ApiProperty({ description: 'Titre du service' })
  @IsString()
  @IsNotEmpty()
  titre!: string;

  @ApiProperty({ description: 'Description détaillée du service' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Type de service', enum: ServiceType })
  @IsEnum(ServiceType)
  type!: ServiceType;

  @ApiProperty({ description: 'Catégorie du service' })
  @IsString()
  @IsNotEmpty()
  categorie!: string;

  @ApiProperty({ description: 'Service gratuit ou payant' })
  @IsBoolean()
  gratuit!: boolean;

  @ApiPropertyOptional({
    description: 'Nombre de points (obligatoire si payant)',
  })
  @ValidateIf((obj: CreateServiceDto) => obj.gratuit === false)
  @IsNotEmpty({
    message: 'Les points sont obligatoires pour un service payant',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ description: 'Statut initial', enum: ServiceStatus })
  @IsOptional()
  @IsEnum(ServiceStatus)
  statut?: ServiceStatus;

  @ApiPropertyOptional({ description: 'ID de la zone' })
  @IsOptional()
  @IsMongoId()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'URL de la photo' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
