import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
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
import { EventsService } from '../services/events.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventResponseDto } from '../dto/event-response.dto';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { MongoIdValidationPipe } from '../../../shared/pipes/mongo-id-validation.pipe';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un événement' })
  @ApiResponse({
    status: 201,
    description: 'Événement créé',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les événements' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre par page' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Recherche par titre/catégorie',
  })
  @ApiQuery({ name: 'categorie', required: false, description: 'Catégorie' })
  @ApiQuery({ name: 'statut', required: false, description: 'Statut' })
  @ApiResponse({
    status: 200,
    description: 'Liste des événements',
    type: [EventResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categorie') categorie?: string,
    @Query('statut') statut?: string,
  ) {
    return this.eventsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      categorie,
      statut,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un événement par ID' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({
    status: 200,
    description: 'Événement trouvé',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async findOne(@Param('id', MongoIdValidationPipe) id: string) {
    const event = await this.eventsService.findById(id);
    if (!event) throw new NotFoundException('Événement introuvable');
    return event;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un événement' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({
    status: 200,
    description: 'Événement mis à jour',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async update(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un événement' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: 'Événement supprimé' })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async remove(@Param('id', MongoIdValidationPipe) id: string) {
    return this.eventsService.delete(id);
  }
}
