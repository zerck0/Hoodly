import { IsString, IsNotEmpty, IsUrl, IsMongoId } from 'class-validator';

export class CreateMembershipDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  zoneId!: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  justificatifUrl!: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  pieceIdentiteUrl!: string;
}
