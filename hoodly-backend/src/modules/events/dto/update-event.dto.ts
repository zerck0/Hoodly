import {
  IsOptional,
  IsString,
  IsDate,
  IsNumber,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../schemas/event.schema';
import { LieuDto } from './create-event.dto';

export class UpdateEventDto {
  @ApiPropertyOptional({ description: "Titre de l'événement" })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiPropertyOptional({ description: 'Catégorie' })
  @IsOptional()
  @IsString()
  categorie?: string;

  @ApiPropertyOptional({ description: "Date de l'événement" })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({ description: 'Lieu' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LieuDto)
  lieu?: LieuDto;

  @ApiPropertyOptional({ description: 'Capacité' })
  @IsOptional()
  @IsNumber()
  capacite?: number;

  @ApiPropertyOptional({ description: 'Statut', enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  statut?: EventStatus;
}
