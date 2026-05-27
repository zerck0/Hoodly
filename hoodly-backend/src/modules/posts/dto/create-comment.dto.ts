import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Contenu du commentaire' })
  @IsString()
  @MaxLength(1000)
  content: string;
}
