import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '../enums/post-type.enum';

export class CreatePostDto {
  @ApiProperty({ description: 'Contenu de la publication' })
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({
    description: 'URLs des médias associés',
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  media?: string[];

  @ApiProperty({ description: 'Type de publication', enum: PostType })
  @IsEnum(PostType)
  type: PostType;
}
