import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
  zoneId?: string;
  [key: string]: unknown;
}

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un contrat d’accord pour un service rémunéré',
  })
  @ApiResponse({ status: 201, description: 'Contrat initié avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Erreur de validation ou fonds insuffisants du client',
  })
  @ApiResponse({
    status: 404,
    description: 'Client, prestataire, ou service introuvable',
  })
  async create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Récupérer tous les contrats de l’utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des contrats de l’utilisateur',
  })
  async findAllForUser(@CurrentUser() user: AuthenticatedUser) {
    return this.contractsService.findAllForUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d’un contrat spécifique' })
  @ApiResponse({ status: 200, description: 'Détails du contrat' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.findOne(id, user.userId);
  }

  @Post(':id/send-otp')
  @ApiOperation({ summary: 'Envoyer un code OTP par e-mail pour la signature' })
  @ApiResponse({ status: 200, description: 'OTP envoyé' })
  @ApiResponse({ status: 403, description: 'Utilisateur non partie prenante' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  async sendOtp(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.sendOtp(id, user.userId);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Signer numériquement un contrat' })
  @ApiResponse({
    status: 200,
    description: 'Signature enregistrée avec succès',
  })
  @ApiResponse({ status: 400, description: 'Déjà signé ou statut invalide' })
  @ApiResponse({ status: 403, description: 'Utilisateur non partie prenante' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  async sign(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() signContractDto: SignContractDto,
    @Ip() reqIp: string,
  ) {
    const ip = reqIp || '127.0.0.1';

    if (!signContractDto.ipAddress) {
      signContractDto.ipAddress = ip;
    }

    return this.contractsService.sign(id, user.userId, signContractDto);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary:
      'Valider la réalisation et finaliser le contrat (transfère les points)',
  })
  @ApiResponse({
    status: 200,
    description: 'Contrat complété et paiement effectué',
  })
  @ApiResponse({
    status: 400,
    description: 'Statut incorrect ou solde de points insuffisant',
  })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  async complete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.complete(id, user.userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler un contrat' })
  @ApiResponse({ status: 200, description: 'Contrat annulé avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Déjà finalisé ou impossible à annuler',
  })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.cancel(id, user.userId);
  }
}
