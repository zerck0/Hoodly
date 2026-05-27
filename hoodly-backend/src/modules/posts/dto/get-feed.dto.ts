import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '../enums/post-type.enum';

export class GetFeedDto {
  @ApiPropertyOptional({
    description: 'ID MongoDB du curseur pour la pagination',
  })
  @IsOptional()
  @IsMongoId()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Nombre de publications à retourner',
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par type de publication',
    enum: PostType,
  })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;
}
