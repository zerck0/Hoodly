import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminActionDto {
  @ApiPropertyOptional({ description: "Commentaire de l'admin" })
  @IsString()
  @IsOptional()
  commentaire?: string;
}
