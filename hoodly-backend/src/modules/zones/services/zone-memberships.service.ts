import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ZoneMembership,
  ZoneMembershipDocument,
} from '../schemas/zone-membership.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Zone, ZoneDocument } from '../schemas/zone.schema';
import { RequestStatus } from '../enums/request-status.enum';
import { ZoneMembershipStatus } from '../../users/enums/zone-membership-status.enum';

@Injectable()
export class ZoneMembershipsService {
  constructor(
    @InjectModel(ZoneMembership.name)
    private zoneMembershipModel: Model<ZoneMembershipDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Zone.name)
    private zoneModel: Model<ZoneDocument>,
  ) {}

  async create(
    zoneId: string,
    userSub: string,
    justificatifUrl: string,
    pieceIdentiteUrl: string,
  ): Promise<ZoneMembership> {
    const user = await this.getUserByAuth0Id(userSub);

    const zone = await this.zoneModel.findById(zoneId);
    if (!zone) {
      throw new NotFoundException('Quartier introuvable');
    }

    const existing = await this.zoneMembershipModel.findOne({
      userId: user._id,
      statut: RequestStatus.PENDING,
    });
    if (existing) {
      throw new BadRequestException('Vous avez déjà une demande en attente');
    }

    const membership = new this.zoneMembershipModel({
      userId: user._id,
      zoneId: new Types.ObjectId(zoneId),
      justificatifUrl,
      pieceIdentiteUrl,
    });

    await this.userModel.findByIdAndUpdate(user._id, {
      zoneStatut: ZoneMembershipStatus.PENDING_MEMBERSHIP,
    });

    return membership.save();
  }

  async findAll(): Promise<ZoneMembership[]> {
    return this.zoneMembershipModel
      .find({ statut: RequestStatus.PENDING })
      .populate('userId', 'nom prenom email')
      .populate('zoneId', 'nom ville')
      .exec();
  }

  async accept(
    membershipId: string,
    adminSub: string,
  ): Promise<ZoneMembership | null> {
    const admin = await this.getAdminByAuth0Id(adminSub);

    const membership = await this.zoneMembershipModel.findById(membershipId);
    if (!membership) {
      throw new NotFoundException('Demande introuvable');
    }

    await this.userModel.findByIdAndUpdate(membership.userId, {
      zoneId: membership.zoneId,
      zoneStatut: ZoneMembershipStatus.ACTIVE,
    });

    await this.zoneModel.findByIdAndUpdate(membership.zoneId, {
      $inc: { membresCount: 1 },
    });

    return this.zoneMembershipModel
      .findByIdAndUpdate(
        membershipId,
        {
          statut: RequestStatus.ACCEPTED,
          traitePar: admin._id,
          traiteLe: new Date(),
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async refuse(
    membershipId: string,
    adminSub: string,
    commentaire: string,
  ): Promise<ZoneMembership | null> {
    const admin = await this.getAdminByAuth0Id(adminSub);

    const membership = await this.zoneMembershipModel.findById(membershipId);
    if (!membership) {
      throw new NotFoundException('Demande introuvable');
    }

    await this.userModel.findByIdAndUpdate(membership.userId, {
      zoneStatut: ZoneMembershipStatus.NO_ZONE,
    });

    return this.zoneMembershipModel
      .findByIdAndUpdate(
        membershipId,
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
