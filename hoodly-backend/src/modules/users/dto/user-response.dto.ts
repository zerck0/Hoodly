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

  @ApiPropertyOptional({ description: 'Prénom' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Nom' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'Date de naissance' })
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Civilité' })
  civility?: string;

  @ApiPropertyOptional({ description: 'Centres d’intérêt', type: [String] })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Matériel disponible' })
  material?: string;

  @ApiPropertyOptional({ description: 'Type de résident' })
  residentType?: string;

  @ApiPropertyOptional({ description: 'Langues parlées' })
  languages?: string;

  @ApiPropertyOptional({
    description: 'Statut de zone',
    enum: ZoneMembershipStatus,
  })
  zoneStatut?: string;

  @ApiPropertyOptional({ description: 'ID de la zone' })
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Motif du refus' })
  refusalReason?: string;

  @ApiPropertyOptional({
    description: 'Type du refus',
    enum: ['zone', 'membership'],
  })
  refusalType?: 'zone' | 'membership';

  @ApiPropertyOptional({ description: 'Solde de points' })
  points?: number;

  @ApiPropertyOptional({ description: 'Biographie / Description' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Missions déjà récupérées',
    type: [String],
  })
  claimedMissions?: string[];
}
