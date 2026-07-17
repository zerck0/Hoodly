import {
  Controller,
  Get,
  Post,
  Patch,
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
} from '@nestjs/swagger';
import { IncidentsService } from '../services/incidents.service';
import { Incident } from '../schemas/incident.schema';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { UserRole } from '../../users/schemas/user.schema';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { UpdateIncidentStatutDto } from '../dto/update-incident-statut.dto';

interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  sub: string;
}

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les incidents' })
  @ApiResponse({ status: 200, description: 'Liste des incidents' })
  findAll(
    @Query('zoneId') zoneId?: string,
    @Query('signaledPar') signaledPar?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<Incident[]> {
    let enforcedSignaledPar = signaledPar;
    if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
      enforcedSignaledPar = user.userId;
    }
    return this.incidentsService.findAll(zoneId, enforcedSignaledPar);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un incident par ID' })
  findOne(@Param('id') id: string): Promise<Incident> {
    return this.incidentsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un incident' })
  @ApiResponse({ status: 201, description: 'Incident créé' })
  create(
    @Body() body: CreateIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Incident> {
    body.signaledPar = user.userId;
    return this.incidentsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: "Mettre à jour le statut d'un incident" })
  @ApiResponse({ status: 200, description: 'Incident mis à jour' })
  updateStatut(
    @Param('id') id: string,
    @Body() body: UpdateIncidentStatutDto,
  ): Promise<Incident> {
    return this.incidentsService.updateStatut(id, body);
  }
}
