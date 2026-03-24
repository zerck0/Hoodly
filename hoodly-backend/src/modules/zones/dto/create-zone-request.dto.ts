import { IsString, IsNotEmpty } from 'class-validator';

export class CreateZoneRequestDto {
  @IsString()
  @IsNotEmpty()
  nomQuartier!: string;

  @IsString()
  @IsNotEmpty()
  ville!: string;

  @IsString()
  @IsNotEmpty()
  codePostal!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}
