import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class UserResponseDto {
  @ApiProperty({ description: 'ID MongoDB' })
  id!: string;

  @ApiProperty({ description: 'ID Auth0' })
  auth0Id!: string;

  @ApiProperty({ description: 'Email' })
  email!: string;

  @ApiPropertyOptional({ description: 'Nom' })
  name?: string;

  @ApiPropertyOptional({ description: 'Photo de profil' })
  picture?: string;

  @ApiProperty({ description: 'Rôle', enum: UserRole })
  role!: UserRole;

  @ApiPropertyOptional({ description: 'Compte actif' })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Date de création' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Date de mise à jour' })
  updatedAt?: Date;
}
