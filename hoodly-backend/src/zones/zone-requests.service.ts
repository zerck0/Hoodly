import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ZoneRequest, ZoneRequestDocument } from './schemas/zone-request.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Zone, ZoneDocument } from './schemas/zone.schema';
import { CreateZoneRequestDto } from './dto/create-zone-request.dto';
import { RequestStatus } from './enums/request-status.enum';
import { ZoneMembershipStatus } from '../users/enums/zone-membership-status.enum';

@Injectable()
export class ZoneRequestsService {
  constructor(
    @InjectModel(ZoneRequest.name)
    private zoneRequestModel: Model<ZoneRequestDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Zone.name)
    private zoneModel: Model<ZoneDocument>,
  ) {}

  async create(
    data: CreateZoneRequestDto,
    userSub: string,
  ): Promise<ZoneRequest> {
    const user = await this.getUserByAuth0Id(userSub);

    const existing = await this.zoneRequestModel.findOne({
      userId: user._id,
      statut: RequestStatus.PENDING,
    });
    if (existing) {
      throw new BadRequestException('Vous avez déjà une demande en attente');
    }

    const request = new this.zoneRequestModel({
      ...data,
      userId: user._id,
    });

    await this.userModel.findByIdAndUpdate(user._id, {
      zoneStatut: ZoneMembershipStatus.PENDING_ZONE,
    });

    return request.save();
  }

  async findAll(): Promise<ZoneRequest[]> {
    return this.zoneRequestModel
      .find({ statut: RequestStatus.PENDING })
      .populate('userId', 'nom prenom email')
      .exec();
  }

  async accept(
    requestId: string,
    adminSub: string,
    commentaire?: string,
  ): Promise<Zone> {
    const admin = await this.getAdminByAuth0Id(adminSub);

    const request = await this.zoneRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    const zone = new this.zoneModel({
      nom: request.nomQuartier,
      ville: request.ville,
      createdPar: admin._id,
    });
    await zone.save();

    await this.zoneRequestModel.findByIdAndUpdate(requestId, {
      statut: RequestStatus.ACCEPTED,
      traitePar: admin._id,
      traiteLe: new Date(),
    });

    await this.userModel.findByIdAndUpdate(request.userId, {
      zoneStatut: ZoneMembershipStatus.NO_ZONE,
    });

    return zone;
  }

  async refuse(
    requestId: string,
    adminSub: string,
    commentaire: string,
  ): Promise<ZoneRequest | null> {
    const admin = await this.getAdminByAuth0Id(adminSub);

    const request = await this.zoneRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    await this.userModel.findByIdAndUpdate(request.userId, {
      zoneStatut: ZoneMembershipStatus.NO_ZONE,
    });

    return this.zoneRequestModel
      .findByIdAndUpdate(
        requestId,
        {
          statut: RequestStatus.REFUSED,
          commentaireAdmin: commentaire,
          traitePar: admin._id,
          traiteLe: new Date(),
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  private async getAdminByAuth0Id(auth0Id: string): Promise<UserDocument> {
    const admin = await this.userModel.findOne({ auth0Id });
    if (!admin) {
      throw new NotFoundException('Admin introuvable');
    }
    return admin;
  }

  private async getUserByAuth0Id(auth0Id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ auth0Id });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }
}
