import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident } from './schemas/incident.schema';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateIncidentDto } from './dto/create-incident.dto';

@UseGuards(JwtGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  findAll(): Promise<Incident[]> {
    return this.incidentsService.findAll();
  }

  @Post()
  create(@Body() body: CreateIncidentDto): Promise<Incident> {
    return this.incidentsService.create(body);
  }
}
