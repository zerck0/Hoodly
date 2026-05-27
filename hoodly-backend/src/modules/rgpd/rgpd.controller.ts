import { Controller, Get, Delete, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RgpdService } from './rgpd.service';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { UserRole } from '../users/schemas/user.schema';

interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  sub: string;
}

@ApiTags('RGPD')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('users')
export class RgpdController {
  constructor(private readonly rgpdService: RgpdService) {}

  @Get('me/export')
  @ApiOperation({
    summary: "Exporter toutes les données de l'utilisateur (RGPD)",
  })
  @ApiResponse({
    status: 200,
    description:
      'Export des données utilisateur au format JSON effectué avec succès.',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié.' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
  async exportData(@CurrentUser() user: AuthenticatedUser) {
    return this.rgpdService.exportUserData(user.userId);
  }

  @Delete('me/anonymize')
  @ApiOperation({
    summary: "Anonymiser/supprimer les données de l'utilisateur (RGPD)",
  })
  @ApiResponse({
    status: 200,
    description:
      "Toutes les données sensibles de l'utilisateur ont été anonymisées ou supprimées.",
  })
  @ApiResponse({ status: 401, description: 'Non authentifié.' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
  async anonymizeData(@CurrentUser() user: AuthenticatedUser) {
    return this.rgpdService.anonymizeUserData(user.userId);
  }
}
