import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';
import { ZoneMembershipStatus } from '../enums/zone-membership-status.enum';

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

  @ApiPropertyOptional({ description: 'Téléphone' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Statut de zone',
    enum: ZoneMembershipStatus,
  })
  zoneStatut?: string;

  @ApiPropertyOptional({ description: 'ID de la zone' })
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Motif du refus' })
  refusalReason?: string;

  @ApiPropertyOptional({ description: 'Type du refus', enum: ['zone', 'membership'] })
  refusalType?: 'zone' | 'membership';
}
