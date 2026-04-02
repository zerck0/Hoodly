import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Zone, ZoneDocument } from '../schemas/zone.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { ZoneStatus } from '../enums/zone-status.enum';
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

export interface ZoneDto {
  id: string;
  nom: string;
  ville: string;
  polygone?: { type: string; coordinates: number[][][] };
  createdPar?: string;
  statut: string;
  membresCount: number;
  createdAt?: string;
  updatedAt?: string;
}

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

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{
    zones: ZoneDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { ville: { $regex: search, $options: 'i' } },
      ];
    }

    const [zones, total] = await Promise.all([
      this.zoneModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.zoneModel.countDocuments(query),
    ]);

    return {
      zones: zones.map((z) => this.toDto(z)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(nom: string, ville: string): Promise<ZoneDto[]> {
    const zones = await this.zoneModel
      .find({
        statut: ZoneStatus.ACTIVE,
        ...(nom && { nom: { $regex: nom, $options: 'i' } }),
        ...(ville && { ville: { $regex: ville, $options: 'i' } }),
      })
      .exec();
    return zones.map((z) => this.toDto(z));
  }

  async create(data: CreateZoneDto, adminSub: string): Promise<ZoneDto> {
    if (!data.polygone) {
      throw new BadRequestException('Le périmètre du quartier est obligatoire');
    }
    const admin = await this.getAdminByAuth0Id(adminSub);
    const zone = new this.zoneModel({
      ...data,
      createdPar: admin._id,
    });
    const saved = await zone.save();
    return this.toDto(saved);
  }

  async findById(id: string): Promise<ZoneDto> {
    const zone = await this.zoneModel.findById(id).exec();
    if (!zone) {
      throw new NotFoundException('Zone introuvable');
    }
    return this.toDto(zone);
  }

  async update(id: string, data: UpdateZoneDto): Promise<ZoneDto> {
    const updated = await this.zoneModel
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Zone introuvable');
    }
    return this.toDto(updated);
  }

  async activate(id: string): Promise<ZoneDto> {
    const updated = await this.zoneModel
      .findByIdAndUpdate(id, { statut: ZoneStatus.ACTIVE }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Zone introuvable');
    }
    return this.toDto(updated);
  }

  async desactivate(id: string): Promise<ZoneDto> {
    const updated = await this.zoneModel
      .findByIdAndUpdate(id, { statut: ZoneStatus.INACTIVE }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Zone introuvable');
    }
    return this.toDto(updated);
  }

  async findMembers(id: string): Promise<User[]> {
    await this.zoneModel
      .findById(id)
      .orFail(new NotFoundException('Zone introuvable'));
    return this.userModel
      .find({
        zoneId: new Types.ObjectId(id),
        zoneStatut: ZoneMembershipStatus.ACTIVE,
      })
      .exec();
  }

  async getMyZone(userSub: string): Promise<ZoneDto | null> {
    const user = await this.userModel.findOne({ auth0Id: userSub }).exec();
    if (!user || !user.zoneId) {
      return null;
    }
    const zone = await this.zoneModel.findById(user.zoneId).exec();
    return zone ? this.toDto(zone) : null;
  }

  async findNearby(lat: number, lng: number): Promise<ZoneDto[]> {
    const zones = await this.zoneModel
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
    return zones.map((z) => this.toDto(z));
  }

  async getStats(id: string): Promise<{
    zone: ZoneDto;
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
    await this.zoneModel
      .findById(id)
      .orFail(new NotFoundException('Zone introuvable'));
    return this.incidentModel.find({ zoneId: new Types.ObjectId(id) }).exec();
  }

  async findEventsByZone(id: string): Promise<Event[]> {
    await this.zoneModel
      .findById(id)
      .orFail(new NotFoundException('Zone introuvable'));
    return this.eventModel.find({ zoneId: new Types.ObjectId(id) }).exec();
  }

  async findServicesByZone(id: string): Promise<Service[]> {
    await this.zoneModel
      .findById(id)
      .orFail(new NotFoundException('Zone introuvable'));
    return this.serviceModel.find({ zoneId: new Types.ObjectId(id) }).exec();
  }

  private toDto(zone: ZoneDocument): ZoneDto {
    return {
      id: (zone._id as unknown as string).toString(),
      nom: zone.nom,
      ville: zone.ville,
      polygone: zone.polygone,
      createdPar: zone.createdPar?.toString(),
      statut: zone.statut,
      membresCount: zone.membresCount,
      createdAt: zone.createdAt?.toISOString(),
      updatedAt: zone.updatedAt?.toISOString(),
    };
  }

  private async getAdminByAuth0Id(auth0Id: string): Promise<UserDocument> {
    const admin = await this.userModel.findOne({ auth0Id });
    if (!admin) {
      throw new NotFoundException('Admin introuvable');
    }
    return admin;
  }
}
