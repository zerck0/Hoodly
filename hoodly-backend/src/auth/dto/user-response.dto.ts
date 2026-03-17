import { UserRole } from '../../users/schemas/user.schema';

export class UserResponseDto {
  id!: string;
  auth0Id!: string;
  email!: string;
  name?: string;
  picture?: string;
  role!: UserRole;
}
