import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class UsersListDto {
  @ApiProperty({ type: [UserResponseDto] })
  users!: UserResponseDto[];

  @ApiProperty({ description: 'Total' })
  total!: number;

  @ApiProperty({ description: 'Page courante' })
  page!: number;

  @ApiProperty({ description: 'Limite par page' })
  limit!: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages!: number;
}
