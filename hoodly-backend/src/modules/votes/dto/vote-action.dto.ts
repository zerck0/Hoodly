import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VoteActionDto {
  @ApiProperty({ description: 'Option choisie pour le vote' })
  @IsString()
  @IsNotEmpty()
  option!: string;
}
