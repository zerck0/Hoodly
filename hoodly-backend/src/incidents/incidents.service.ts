import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from './schemas/incident.schema';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  async findAll(): Promise<Incident[]> {
    return this.incidentModel.find().exec();
  }

  async create(data: Partial<Incident>): Promise<Incident> {
    const incident = new this.incidentModel(data);
    return incident.save();
  }
}
