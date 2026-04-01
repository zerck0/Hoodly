import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Zone, ZoneDocument } from '../schemas/zone.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { ZoneStatus } from '../enums/zone-status.enum';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { ZoneMembershipStatus } from 'src/modules/users/enums/zone-membership-status.enum';
import {
  ZoneMembership,
  ZoneMembershipDocument,
} from '../schemas/zone-membership.schema';
import {
  Incident,
  IncidentDocument,
} from 'src/modules/incidents/schemas/incident.schema';
import { Event, EventDocument } from 'src/modules/events/schemas/event.schema';
import {
  Service,
  ServiceDocument,
} from 'src/modules/services/schemas/service.schema';

@Injectable()
export class ZonesService {
  constructor(
    @InjectModel(Zone.name) private zoneModel: Model<ZoneDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ZoneMembership.name)
    private membershipModel: Model<ZoneMembershipDocument>,
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  async findAll(): Promise<Zone[]> {
    return this.zoneModel.find({ statut: ZoneStatus.ACTIVE }).exec();
  }

  async search(nom: string, ville: string): Promise<Zone[]> {
    return this.zoneModel
      .find({
        statut: ZoneStatus.ACTIVE,
        ...(nom && { nom: { $regex: nom, $options: 'i' } }),
        ...(ville && { ville: { $regex: ville, $options: 'i' } }),
      })
      .exec();
  }

  async create(data: CreateZoneDto, adminSub: string): Promise<Zone> {
    const admin = await this.getAdminByAuth0Id(adminSub);

    const zone = new this.zoneModel({
      ...data,
      createdPar: admin._id,
    });
    return zone.save();
  }

  private async getAdminByAuth0Id(auth0Id: string): Promise<UserDocument> {
    const admin = await this.userModel.findOne({ auth0Id });
    if (!admin) {
      throw new NotFoundException('Admin introuvable');
    }
    return admin;
  }

  async findById(id: string): Promise<Zone> {
    const zone = await this.zoneModel.findById(id).exec();
    if (!zone) {
      throw new NotFoundException('Zone introuvable');
    }
    return zone;
  }

  async update(id: string, data: UpdateZoneDto): Promise<Zone> {
    const updated = await this.zoneModel
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Zone introuvable');
    }
    return updated;
  }

  async activate(id: string): Promise<Zone> {
    const updated = await this.zoneModel
      .findByIdAndUpdate(id, { statut: ZoneStatus.ACTIVE }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Zone introuvable');
    }
    return updated;
  }

  async desactivate(id: string): Promise<Zone> {
    const updated = await this.zoneModel
      .findByIdAndUpdate(id, { statut: ZoneStatus.INACTIVE }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Zone introuvable');
    }
    return updated;
  }

  async findMembers(id: string): Promise<User[]> {
    return this.userModel
      .find({
        zoneId: new Types.ObjectId(id),
        zoneStatut: ZoneMembershipStatus.ACTIVE,
      })
      .exec();
  }

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{
    zones: Zone[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [zones, total] = await Promise.all([
      this.zoneModel
        .find({ statut: ZoneStatus.ACTIVE })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.zoneModel.countDocuments({ statut: ZoneStatus.ACTIVE }),
    ]);
    return {
      zones,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMyZone(userSub: string): Promise<Zone | null> {
    const user = await this.userModel.findOne({ auth0Id: userSub }).exec();
    if (!user || !user.zoneId) {
      return null;
    }
    return this.zoneModel.findById(user.zoneId).exec();
  }

  async findNearby(lat: number, lng: number): Promise<Zone[]> {
    return this.zoneModel
      .find({
        statut: ZoneStatus.ACTIVE,
        polygone: {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
          },
        },
      })
      .exec();
  }

  async getStats(id: string): Promise<{
    zone: Zone;
    membersCount: number;
    incidentsCount: number;
    activeIncidentsCount: number;
    eventsCount: number;
    servicesCount: number;
  }> {
    const zone = await this.findById(id);
    const zoneId = new Types.ObjectId(id);

    const [
      membersCount,
      incidents,
      activeIncidentsCount,
      eventsCount,
      servicesCount,
    ] = await Promise.all([
      this.userModel.countDocuments({
        zoneId,
        zoneStatut: ZoneMembershipStatus.ACTIVE,
      }),
      this.incidentModel.countDocuments({ zoneId }),
      this.incidentModel.countDocuments({
        zoneId,
        statut: { $in: ['signale', 'en_cours'] },
      }),
      this.eventModel.countDocuments({ zoneId }),
      this.serviceModel.countDocuments({ zoneId }),
    ]);

    return {
      zone,
      membersCount,
      incidentsCount: incidents,
      activeIncidentsCount,
      eventsCount,
      servicesCount,
    };
  }

  async findIncidentsByZone(id: string): Promise<Incident[]> {
    await this.findById(id);
    return this.incidentModel.find({ zoneId: new Types.ObjectId(id) }).exec();
  }

  async findEventsByZone(id: string): Promise<Event[]> {
    await this.findById(id);
    return this.eventModel.find({ zoneId: new Types.ObjectId(id) }).exec();
  }

  async findServicesByZone(id: string): Promise<Service[]> {
    await this.findById(id);
    return this.serviceModel.find({ zoneId: new Types.ObjectId(id) }).exec();
  }
}
