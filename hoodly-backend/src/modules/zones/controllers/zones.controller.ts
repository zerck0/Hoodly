import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
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
import { ZonesService } from '../services/zones.service';
import { ZoneRequestsService } from '../services/zone-requests.service';
import { ZoneMembershipsService } from '../services/zone-memberships.service';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/schemas/user.schema';
import { MongoIdValidationPipe } from '../../../shared/pipes/mongo-id-validation.pipe';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { CreateZoneRequestDto } from '../dto/create-zone-request.dto';
import { CreateMembershipDto } from '../dto/create-membership.dto';
import { BulkActionZoneRequestDto } from '../dto/bulk-action-zone-request.dto';
import { AdminActionDto } from '../dto/admin-action.dto';
import type { JwtPayloadDto } from '../../../core/auth/dto/jwt-payload.dto';

@ApiTags('Zones')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('zones')
export class ZonesController {
  constructor(
    private readonly zonesService: ZonesService,
    private readonly zoneRequestsService: ZoneRequestsService,
    private readonly zoneMembershipsService: ZoneMembershipsService,
  ) {}

  @Post('requests/bulk-accept')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Accepter plusieurs demandes et créer une zone' })
  @ApiResponse({ status: 200, description: 'Zone créée et demandes validées' })
  bulkAcceptZoneRequests(
    @Body() body: BulkActionZoneRequestDto,
    @CurrentUser() user: JwtPayloadDto,
  ) {
    return this.zoneRequestsService.bulkAccept(body, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les zones' })
  @ApiQuery({ name: 'page', required: false, description: 'Page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite par page' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Recherche texte sur nom ou ville',
  })
  @ApiResponse({ status: 200, description: 'Liste des zones' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? Number.parseInt(page, 10) : 1;
    const limitNum = limit ? Number.parseInt(limit, 10) : 20;
    return this.zonesService.findAllPaginated(pageNum, limitNum, search);
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des zones' })
  @ApiQuery({ name: 'nom', required: false, description: 'Nom du quartier' })
  @ApiQuery({ name: 'ville', required: false, description: 'Ville' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche' })
  search(@Query('nom') nom: string, @Query('ville') ville: string) {
    return this.zonesService.search(nom, ville);
  }

  @Get('my')
  @ApiOperation({ summary: 'Récupérer ma zone (utilisateur connecté)' })
  @ApiResponse({ status: 200, description: 'Zone de l utilisateur' })
  @ApiResponse({ status: 204, description: 'Utilisateur sans zone' })
  getMyZone(@CurrentUser() user: JwtPayloadDto) {
    return this.zonesService.getMyZone(user.sub);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Trouver les zones proches d un point GPS' })
  @ApiQuery({ name: 'lat', description: 'Latitude' })
  @ApiQuery({ name: 'lng', description: 'Longitude' })
  @ApiResponse({ status: 200, description: 'Zones trouvées' })
  findNearby(@Query('lat') lat: string, @Query('lng') lng: string) {
    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lng);
    return this.zonesService.findNearby(latitude, longitude);
  }

  @Get('requests')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Lister les demandes de création de zone' })
  @ApiResponse({ status: 200, description: 'Liste des demandes' })
  findAllZoneRequests() {
    return this.zoneRequestsService.findAll();
  }

  @Post('memberships/intent/:zoneId')
  @ApiOperation({ summary: "Marquer l'intention de rejoindre un quartier" })
  @ApiResponse({ status: 200, description: 'Statut utilisateur mis à jour' })
  intentMembership(
    @Param('zoneId', MongoIdValidationPipe) zoneId: string,
    @CurrentUser() user: JwtPayloadDto,
  ) {
    return this.zoneMembershipsService.intent(zoneId, user.sub);
  }

  @Get('memberships')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: "Lister les demandes d'adhésion" })
  @ApiResponse({ status: 200, description: 'Liste des adhésions' })
  findAllMemberships() {
    return this.zoneMembershipsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une zone par son ID' })
  @ApiParam({ name: 'id', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Zone trouvée' })
  @ApiResponse({ status: 404, description: 'Zone introuvable' })
  findOne(@Param('id', MongoIdValidationPipe) id: string) {
    return this.zonesService.findById(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Lister les membres d une zone' })
  @ApiParam({ name: 'id', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Liste des membres' })
  @ApiResponse({ status: 404, description: 'Zone introuvable' })
  findMembers(@Param('id', MongoIdValidationPipe) id: string) {
    return this.zonesService.findMembers(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques d une zone' })
  @ApiParam({ name: 'id', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  @ApiResponse({ status: 404, description: 'Zone introuvable' })
  getStats(@Param('id', MongoIdValidationPipe) id: string) {
    return this.zonesService.getStats(id);
  }

  @Get(':id/incidents')
  @ApiOperation({ summary: 'Lister les incidents d une zone' })
  @ApiParam({ name: 'id', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Liste des incidents' })
  @ApiResponse({ status: 404, description: 'Zone introuvable' })
  findIncidentsByZone(@Param('id', MongoIdValidationPipe) id: string) {
    return this.zonesService.findIncidentsByZone(id);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Lister les événements d une zone' })
  @ApiParam({ name: 'id', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Liste des événements' })
  @ApiResponse({ status: 404, description: 'Zone introuvable' })
  findEventsByZone(@Param('id', MongoIdValidationPipe) id: string) {
    return this.zonesService.findEventsByZone(id);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Lister les services d une zone' })
  @ApiParam({ name: 'id', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Liste des services' })
  @ApiResponse({ status: 404, description: 'Zone introuvable' })
  findServicesByZone(@Param('id', MongoIdValidationPipe) id: string) {
    return this.zonesService.findServicesByZone(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer une zone (admin)' })
  @ApiResponse({ status: 201, description: 'Zone créée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  create(@Body() body: CreateZoneDto, @CurrentUser() user: JwtPayloadDto) {
    return this.zonesService.create(body, user.sub);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Réactiver une zone (admin)' })
  @ApiParam({ name: 'id', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Zone réactivée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Zone introuvable' })
  activate(@Param('id', MongoIdValidationPipe) id: string) {
    return this.zonesService.activate(id);
  }

  @Post('requests')
  @ApiOperation({ summary: "Demander la création d'une zone" })
  @ApiResponse({ status: 201, description: 'Demande créée' })
  createZoneRequest(
    @Body() body: CreateZoneRequestDto,
    @CurrentUser() user: JwtPayloadDto,
  ) {
    return this.zoneRequestsService.create(body, user.sub);
  }

  @Post('memberships')
  @ApiOperation({ summary: 'Demander une adhésion à une zone' })
  @ApiResponse({ status: 201, description: "Demande d'adhésion créée" })
  createMembership(
    @Body() body: CreateMembershipDto,
    @CurrentUser() user: JwtPayloadDto,
  ) {
    return this.zoneMembershipsService.create(
      body.zoneId,
      user.sub,
      body.justificatifUrl,
      body.pieceIdentiteUrl,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier une zone (admin)' })
  @ApiParam({ name: 'id', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Zone modifiée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Zone introuvable' })
  update(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: UpdateZoneDto,
  ) {
    return this.zonesService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Désactiver une zone (admin)' })
  @ApiParam({ name: 'id', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Zone désactivée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Zone introuvable' })
  desactivate(@Param('id', MongoIdValidationPipe) id: string) {
    return this.zonesService.desactivate(id);
  }

  @Put('requests/:id/accept')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Accepter une demande de création de zone' })
  @ApiParam({ name: 'id', description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Demande acceptée, zone créée' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  acceptZoneRequest(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: JwtPayloadDto,
    @Body() body: AdminActionDto,
  ) {
    return this.zoneRequestsService.accept(
      id,
      user.sub,
      body.commentaire ?? undefined,
    );
  }

  @Put('requests/:id/refuse')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Refuser une demande de création de zone' })
  @ApiParam({ name: 'id', description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Demande refusée' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  refuseZoneRequest(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: JwtPayloadDto,
    @Body() body: AdminActionDto,
  ) {
    return this.zoneRequestsService.refuse(
      id,
      user.sub,
      body.commentaire ?? '',
    );
  }

  @Put('memberships/:id/accept')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Accepter une adhésion' })
  @ApiParam({ name: 'id', description: "ID de l'adhésion" })
  @ApiResponse({ status: 200, description: 'Adhésion acceptée' })
  @ApiResponse({ status: 404, description: 'Adhésion introuvable' })
  acceptMembership(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: JwtPayloadDto,
  ) {
    return this.zoneMembershipsService.accept(id, user.sub);
  }

  @Put('memberships/:id/refuse')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Refuser une adhésion' })
  @ApiParam({ name: 'id', description: "ID de l'adhésion" })
  @ApiResponse({ status: 200, description: 'Adhésion refusée' })
  @ApiResponse({ status: 404, description: 'Adhésion introuvable' })
  refuseMembership(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: JwtPayloadDto,
    @Body() body: AdminActionDto,
  ) {
    return this.zoneMembershipsService.refuse(
      id,
      user.sub,
      body.commentaire ?? '',
    );
  }
}
