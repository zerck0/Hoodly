import { IsString, IsNotEmpty, IsUrl, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMembershipDto {
  @ApiProperty({ description: 'ID de la zone' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  zoneId!: string;

  @ApiProperty({ description: 'URL du justificatif de domicile' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  justificatifUrl!: string;

  @ApiProperty({ description: "URL de la pièce d'identité" })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  pieceIdentiteUrl!: string;
}
