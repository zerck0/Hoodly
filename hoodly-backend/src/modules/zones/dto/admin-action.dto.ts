import { IsString, IsOptional } from 'class-validator';

export class AdminActionDto {
  @IsString()
  @IsOptional()
  commentaire?: string;
}
