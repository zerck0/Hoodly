import { UserRole } from '../schemas/user.schema';

export class UserResponseDto {
  id!: string;
  auth0Id!: string;
  email!: string;
  name?: string;
  picture?: string;
  role!: UserRole;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
