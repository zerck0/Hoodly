import {
  Controller,
  Get,
  Post,
  Put,
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
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/schemas/user.schema';
import { MongoIdValidationPipe } from '../../../shared/pipes/mongo-id-validation.pipe';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { CreateZoneRequestDto } from '../dto/create-zone-request.dto';
import { CreateMembershipDto } from '../dto/create-membership.dto';
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

  @Get()
  @ApiOperation({ summary: 'Lister toutes les zones' })
  @ApiResponse({ status: 200, description: 'Liste des zones' })
  findAll() {
    return this.zonesService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des zones' })
  @ApiQuery({ name: 'nom', required: false, description: 'Nom du quartier' })
  @ApiQuery({ name: 'ville', required: false, description: 'Ville' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche' })
  search(@Query('nom') nom: string, @Query('ville') ville: string) {
    return this.zonesService.search(nom, ville);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer une zone (admin)' })
  @ApiResponse({ status: 201, description: 'Zone créée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  create(@Body() body: CreateZoneDto, @CurrentUser() user: JwtPayloadDto) {
    return this.zonesService.create(body, user.sub);
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

  @Get('requests')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Lister les demandes de création de zone' })
  @ApiResponse({ status: 200, description: 'Liste des demandes' })
  findAllZoneRequests() {
    return this.zoneRequestsService.findAll();
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

  @Get('memberships')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: "Lister les demandes d'adhésion" })
  @ApiResponse({ status: 200, description: 'Liste des adhésions' })
  findAllMemberships() {
    return this.zoneMembershipsService.findAll();
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
