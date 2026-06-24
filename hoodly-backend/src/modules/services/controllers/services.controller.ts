import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ServicesService } from '../services/services.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { VerifiedGuard } from '../../../core/auth/guards/verified.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { MongoIdValidationPipe } from '../../../shared/pipes/mongo-id-validation.pipe';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtGuard, VerifiedGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un service' })
  @ApiResponse({ status: 201, description: 'Service créé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.servicesService.create(createServiceDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les services' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre par page' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche texte' })
  @ApiQuery({ name: 'type', required: false, description: 'offre ou demande' })
  @ApiQuery({
    name: 'statut',
    required: false,
    description: 'Statut du service',
  })
  @ApiQuery({ name: 'categorie', required: false, description: 'Catégorie' })
  @ApiQuery({ name: 'zoneId', required: false, description: 'ID de la zone' })
  @ApiQuery({
    name: 'createurId',
    required: false,
    description: 'ID du créateur',
  })
  @ApiQuery({
    name: 'responderId',
    required: false,
    description: "ID de l'intervenant",
  })
  @ApiResponse({ status: 200, description: 'Liste des services' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('statut') statut?: string,
    @Query('categorie') categorie?: string,
    @Query('zoneId') zoneId?: string,
    @Query('createurId') createurId?: string,
    @Query('responderId') responderId?: string,
  ) {
    return this.servicesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      type,
      statut,
      categorie,
      zoneId,
      createurId,
      responderId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un service par ID' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: 'Service trouvé' })
  @ApiResponse({ status: 404, description: 'Service introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async findOne(@Param('id', MongoIdValidationPipe) id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un service' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: 'Service mis à jour' })
  @ApiResponse({ status: 404, description: 'Service introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async update(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.servicesService.update(
      id,
      updateServiceDto,
      user.userId,
      user.role,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un service' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: 'Service supprimé' })
  @ApiResponse({ status: 404, description: 'Service introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async remove(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.servicesService.delete(id, user.userId, user.role);
  }

  @Patch(':id/accepter')
  @ApiOperation({ summary: 'Accepter de répondre à un service' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: 'Service accepté' })
  async accepter(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: { responderId?: string },
    @CurrentUser() user: { userId: string },
  ) {
    const responderId = body?.responderId || user.userId;
    return this.servicesService.accepter(id, responderId);
  }

  @Patch(':id/refuser')
  @ApiOperation({ summary: 'Refuser un candidat pour un service' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: 'Candidat refusé' })
  async refuser(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: { responderId: string },
  ) {
    return this.servicesService.refuser(id, body.responderId);
  }

  @Patch(':id/demarrer')
  @ApiOperation({ summary: "Démarrer la réalisation d'un service" })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: 'Service démarré' })
  async demarrer(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: { conversationId?: string },
    @CurrentUser() user: { userId: string },
  ) {
    return this.servicesService.demarrer(id, user.userId, body?.conversationId);
  }

  @Patch(':id/terminer')
  @ApiOperation({
    summary: "Marquer un service comme accompli par l'intervenant",
  })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: 'Service marqué comme accompli' })
  async terminer(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: { conversationId?: string },
    @CurrentUser() user: { userId: string },
  ) {
    return this.servicesService.terminer(id, user.userId, body?.conversationId);
  }

  @Patch(':id/valider')
  @ApiOperation({
    summary: 'Valider la réalisation finale du service par le créateur',
  })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({
    status: 200,
    description: 'Réalisation du service validée et clôturée',
  })
  async valider(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: { conversationId?: string },
    @CurrentUser() user: { userId: string },
  ) {
    return this.servicesService.valider(id, user.userId, body?.conversationId);
  }
}
