import { IsMongoId, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiPropertyOptional({ description: "ID de l'annonce d'entraide (service)" })
  @IsOptional()
  @IsMongoId()
  serviceId?: string;

  @ApiProperty({ description: 'ID du destinataire' })
  @IsNotEmpty()
  @IsMongoId()
  destinataireId!: string;
}
