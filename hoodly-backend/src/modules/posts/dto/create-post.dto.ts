import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PostType } from '../enums/post-type.enum';

export class CreatePostDto {
  @IsString()
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsString({ each: true })
  media?: string[];

  @IsEnum(PostType)
  type: PostType;
}
