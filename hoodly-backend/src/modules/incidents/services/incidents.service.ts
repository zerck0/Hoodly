import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Incident, IncidentDocument } from '../schemas/incident.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { UpdateIncidentStatutDto } from '../dto/update-incident-statut.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(zoneId?: string, signaledPar?: string): Promise<Incident[]> {
    const filter: any = {};
    if (zoneId) filter.zoneId = new Types.ObjectId(zoneId);
    if (signaledPar) {
      if (Types.ObjectId.isValid(signaledPar)) {
        filter.signaledPar = new Types.ObjectId(signaledPar);
      } else {
        filter.signaledPar = signaledPar;
      }
    }
    const incidents = await this.incidentModel
      .find(filter)
      .lean()
      .exec();

    return this.populateSignaledPar(incidents) as unknown as Incident[];
  }

  async findById(id: string): Promise<Incident> {
    const incident = await this.incidentModel
      .findById(id)
      .lean()
      .exec();
    if (!incident) throw new NotFoundException(`Incident ${id} introuvable`);
    const populated = await this.populateSignaledPar([incident]);
    return populated[0] as unknown as Incident;
  }

  async create(data: CreateIncidentDto): Promise<Incident> {
    const incidentData: any = { ...data };
    if (data.assignedTo) {
      incidentData.assignedTo = new Types.ObjectId(data.assignedTo);
    }
    if (data.zoneId) {
      incidentData.zoneId = new Types.ObjectId(data.zoneId);
    }
    if (data.serviceId) {
      incidentData.serviceId = new Types.ObjectId(data.serviceId);
    }
    if (data.eventId) {
      incidentData.eventId = new Types.ObjectId(data.eventId);
    }
    if (data.signaledPar) {
      incidentData.signaledPar = data.signaledPar;
    }
    const incident = new this.incidentModel(incidentData);
    return incident.save();
  }

  private async populateSignaledPar(incidents: any[]): Promise<any[]> {
    const userIds = incidents
      .map((inc) => inc.signaledPar)
      .filter(
        (id): id is string =>
          !!id && id !== 'anonymized' && Types.ObjectId.isValid(id),
      );

    if (userIds.length === 0) return incidents;

    const uniqueUserIds = [...new Set(userIds)];
    const users = await this.userModel
      .find({ _id: { $in: uniqueUserIds.map((id) => new Types.ObjectId(id)) } })
      .select('name email firstName lastName')
      .lean()
      .exec();

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    return incidents.map((inc) => {
      const populated = { ...inc };
      if (inc.signaledPar) {
        if (inc.signaledPar === 'anonymized') {
          // Keep as string
        } else {
          const userObj = userMap.get(String(inc.signaledPar));
          if (userObj) {
            populated.signaledPar = userObj;
          }
        }
      }
      return populated;
    });
  }

  async updateStatut(
    id: string,
    dto: UpdateIncidentStatutDto,
  ): Promise<Incident> {
    const updateData: any = { statut: dto.statut };
    if (dto.assignedTo !== undefined) {
      updateData.assignedTo = dto.assignedTo
        ? new Types.ObjectId(dto.assignedTo)
        : null;
    }
    if (dto.resolutionComment !== undefined) {
      updateData.resolutionComment = dto.resolutionComment;
    }

    const updated = await this.incidentModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException(`Incident ${id} introuvable`);
    return updated as unknown as Incident;
  }
}
