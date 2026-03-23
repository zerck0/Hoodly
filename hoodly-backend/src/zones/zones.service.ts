import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Zone, ZoneDocument } from './schemas/zone.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateZoneDto } from './dto/create-zone.dto';
import { ZoneStatus } from './enums/zone-status.enum';

@Injectable()
export class ZonesService {
  constructor(
    @InjectModel(Zone.name) private zoneModel: Model<ZoneDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
}
