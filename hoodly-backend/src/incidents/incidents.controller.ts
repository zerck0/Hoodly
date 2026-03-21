import { Controller, Get, Post, Body } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident } from './schemas/incident.schema';
import { Public } from '../auth/decorators/public.decorator';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Public()
  @Get()
  findAll(): Promise<Incident[]> {
    return this.incidentsService.findAll();
  }

  @Public()
  @Post()
  create(@Body() body: Partial<Incident>): Promise<Incident> {
    return this.incidentsService.create(body);
  }
}
