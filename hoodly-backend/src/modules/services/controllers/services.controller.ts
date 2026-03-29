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
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { MongoIdValidationPipe } from '../../../shared/pipes/mongo-id-validation.pipe';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtGuard)
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
  ) {
    return this.servicesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      type,
      statut,
      categorie,
      zoneId,
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
}
