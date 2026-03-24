import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { IncidentsService } from '../services/incidents.service';
import { Incident } from '../schemas/incident.schema';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { CreateIncidentDto } from '../dto/create-incident.dto';

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les incidents' })
  @ApiResponse({ status: 200, description: 'Liste des incidents' })
  findAll(): Promise<Incident[]> {
    return this.incidentsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Créer un incident' })
  @ApiResponse({ status: 201, description: 'Incident créé' })
  create(@Body() body: CreateIncidentDto): Promise<Incident> {
    return this.incidentsService.create(body);
  }
}
