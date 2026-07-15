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
import { EmailsService } from '../../emails/emails.service';
import { UploadsService } from '../../uploads/services/uploads.service';

@Injectable()
export class ZoneMembershipsService {
  constructor(
    @InjectModel(ZoneMembership.name)
    private zoneMembershipModel: Model<ZoneMembershipDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Zone.name)
    private zoneModel: Model<ZoneDocument>,
    private readonly emailsService: EmailsService,
    private readonly uploadsService: UploadsService,
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
      zoneStatut: ZoneMembershipStatus.VERIF_EN_COURS,
      $unset: { refusalReason: '', refusalType: '' },
    });

    const savedMembership = await membership.save();

    if (user.email) {
      this.emailsService.sendWelcomeJoinEmail(
        user.email,
        user.name || '',
        zone.nom,
      ).catch((err) => {
        console.error(`[ZoneMembershipsService] Error sending welcome join email: ${err.message}`);
      });
    }

    return savedMembership;
  }

  async intent(zoneId: string, userSub: string): Promise<UserDocument> {
    const user = await this.getUserByAuth0Id(userSub);

    const zone = await this.zoneModel.findById(zoneId);
    if (!zone) {
      throw new NotFoundException('Quartier introuvable');
    }

    return this.userModel.findByIdAndUpdate(
      user._id,
      {
        zoneId: new Types.ObjectId(zoneId),
        zoneStatut: ZoneMembershipStatus.PENDING_MEMBERSHIP,
      },
      { new: true },
    ) as Promise<UserDocument>;
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
      $unset: { refusalReason: '', refusalType: '' },
    });

    await this.zoneModel.findByIdAndUpdate(membership.zoneId, {
      $inc: { membresCount: 1 },
    });

    if (membership.justificatifUrl && membership.justificatifUrl !== 'DELETED_RGPD') {
      await this.uploadsService.deleteFile(membership.justificatifUrl).catch((err) => {
        console.error(`[ZoneMembershipsService] Failed to delete justificatif file: ${err.message}`);
      });
    }
    if (membership.pieceIdentiteUrl && membership.pieceIdentiteUrl !== 'DELETED_RGPD') {
      await this.uploadsService.deleteFile(membership.pieceIdentiteUrl).catch((err) => {
        console.error(`[ZoneMembershipsService] Failed to delete pieceIdentite file: ${err.message}`);
      });
    }

    const acceptedMembership = await this.zoneMembershipModel
      .findByIdAndUpdate(
        membershipId,
        {
          statut: RequestStatus.ACCEPTED,
          traitePar: admin._id,
          traiteLe: new Date(),
          justificatifUrl: 'DELETED_RGPD',
          pieceIdentiteUrl: 'DELETED_RGPD',
        },
        { returnDocument: 'after' },
      )
      .exec();

    const user = await this.userModel.findById(membership.userId);
    const zone = await this.zoneModel.findById(membership.zoneId);
    if (user && user.email && zone) {
      this.emailsService.sendMembershipApprovedEmail(
        user.email,
        user.name || '',
        zone.nom,
      ).catch((err) => {
        console.error(`[ZoneMembershipsService] Error sending membership approved email: ${err.message}`);
      });
    }

    return acceptedMembership;
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
      zoneStatut: ZoneMembershipStatus.PENDING_MEMBERSHIP,
      refusalReason: commentaire,
      refusalType: 'membership',
    });

    if (membership.justificatifUrl && membership.justificatifUrl !== 'DELETED_RGPD') {
      await this.uploadsService.deleteFile(membership.justificatifUrl).catch((err) => {
        console.error(`[ZoneMembershipsService] Failed to delete justificatif file: ${err.message}`);
      });
    }
    if (membership.pieceIdentiteUrl && membership.pieceIdentiteUrl !== 'DELETED_RGPD') {
      await this.uploadsService.deleteFile(membership.pieceIdentiteUrl).catch((err) => {
        console.error(`[ZoneMembershipsService] Failed to delete pieceIdentite file: ${err.message}`);
      });
    }

    return this.zoneMembershipModel
      .findByIdAndUpdate(
        membershipId,
        {
          statut: RequestStatus.REFUSED,
          commentaireAdmin: commentaire,
          traitePar: admin._id,
          traiteLe: new Date(),
          justificatifUrl: 'DELETED_RGPD',
          pieceIdentiteUrl: 'DELETED_RGPD',
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
