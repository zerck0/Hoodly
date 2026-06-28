import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class QueryDocumentDto {
  @ApiProperty({
    description: 'La requête textuelle en langage personnalisé Hoodly',
    example: 'FIND WHERE status = "signed"',
  })
  @IsNotEmpty({ message: 'La requête ne peut pas être vide' })
  @IsString({ message: 'La requête doit être une chaîne de caractères' })
  query!: string;
}
