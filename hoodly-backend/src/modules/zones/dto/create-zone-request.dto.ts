import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateZoneRequestDto {
  @ApiProperty({ description: 'Nom du quartier' })
  @IsString()
  @IsNotEmpty()
  nomQuartier!: string;

  @ApiProperty({ description: 'Ville' })
  @IsString()
  @IsNotEmpty()
  ville!: string;

  @ApiProperty({ description: 'Code postal' })
  @IsString()
  @IsNotEmpty()
  codePostal!: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}
