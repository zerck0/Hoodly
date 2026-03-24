import { UserResponseDto } from './user-response.dto';

export class UsersListDto {
  users!: UserResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
