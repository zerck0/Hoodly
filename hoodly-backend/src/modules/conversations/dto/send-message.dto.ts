import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Contenu du message', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'URL de l\'image', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
