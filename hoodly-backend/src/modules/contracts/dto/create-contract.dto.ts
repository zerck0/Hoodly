import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateContractDto {
  @ApiProperty({ description: 'ID du prestataire du service (fournisseur)' })
  @IsMongoId()
  @IsNotEmpty()
  providerId!: string;

  @ApiProperty({ description: 'ID du client du service (acheteur)' })
  @IsMongoId()
  @IsNotEmpty()
  clientId!: string;

  @ApiProperty({ description: 'ID du service associé dans le catalogue' })
  @IsMongoId()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ description: 'Titre du contrat' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Termes et conditions détaillés du contrat' })
  @IsString()
  @IsNotEmpty()
  terms!: string;

  @ApiProperty({ description: 'Coût en points du service', example: 50 })
  @IsNumber()
  @Min(0)
  pricePoints!: number;
}
