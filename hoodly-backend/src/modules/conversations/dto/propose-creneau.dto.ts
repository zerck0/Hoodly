import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProposeCreneauDto {
  @ApiProperty({ description: 'Date de la proposition (chaîne de caractères)' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ description: 'Heure de début (format HH:MM)' })
  @IsString()
  @IsNotEmpty()
  debut!: string;

  @ApiProperty({ description: 'Heure de fin (format HH:MM)' })
  @IsString()
  @IsNotEmpty()
  fin!: string;
}
