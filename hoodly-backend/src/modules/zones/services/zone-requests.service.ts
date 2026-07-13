import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ZoneRequest,
  ZoneRequestDocument,
} from '../schemas/zone-request.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Zone, ZoneDocument } from '../schemas/zone.schema';
import { CreateZoneRequestDto } from '../dto/create-zone-request.dto';
import { BulkActionZoneRequestDto } from '../dto/bulk-action-zone-request.dto';
import { RequestStatus } from '../enums/request-status.enum';
import { ZoneMembershipStatus } from '../../users/enums/zone-membership-status.enum';
import { EmailsService } from '../../emails/emails.service';

@Injectable()
export class ZoneRequestsService {
  constructor(
    @InjectModel(ZoneRequest.name)
    private zoneRequestModel: Model<ZoneRequestDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Zone.name)
    private zoneModel: Model<ZoneDocument>,
    private readonly emailsService: EmailsService,
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
      nomQuartier: data.nomQuartier,
      ville: data.ville,
      codePostal: data.codePostal,
      description: data.description,
      userId: user._id,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
    });

    await this.userModel.findByIdAndUpdate(user._id, {
      zoneStatut: ZoneMembershipStatus.PENDING_ZONE,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
      $unset: { refusalReason: '', refusalType: '' },
    });

    const savedRequest = await request.save();

    if (user.email) {
      this.emailsService.sendWelcomeCreationEmail(
        user.email,
        user.name || '',
        data.nomQuartier,
      ).catch((err) => {
        console.error(`[ZoneRequestsService] Error sending welcome creation email: ${err.message}`);
      });
    }

    return savedRequest;
  }

  async findAll(): Promise<ZoneRequest[]> {
    return this.zoneRequestModel
      .find({ statut: RequestStatus.PENDING })
      .populate('userId', 'name email picture location')
      .exec();
  }

  async bulkAccept(
    data: BulkActionZoneRequestDto,
    adminSub: string,
  ): Promise<Zone> {
    const admin = await this.getAdminByAuth0Id(adminSub);

    const zone = new this.zoneModel({
      nom: data.nomQuartier,
      ville: data.ville,
      polygone: data.polygone,
      createdPar: admin._id,
    });
    await zone.save();

    await this.zoneRequestModel.updateMany(
      { _id: { $in: data.requestIds } },
      {
        statut: RequestStatus.ACCEPTED,
        commentaireAdmin: data.commentaire,
        traitePar: admin._id,
        traiteLe: new Date(),
      },
    );

    const requests = await this.zoneRequestModel.find({
      _id: { $in: data.requestIds },
    });
    const userIds = requests.map((r) => r.userId);

    await this.userModel.updateMany(
      { _id: { $in: userIds } },
      {
        zoneId: zone._id,
        zoneStatut: ZoneMembershipStatus.PENDING_MEMBERSHIP,
      },
    );

    const users = await this.userModel.find({ _id: { $in: userIds } });
    for (const r of requests) {
      const u = users.find((user) => user._id.toString() === r.userId.toString());
      if (u && u.email) {
        this.emailsService.sendNeighborhoodCreatedEmail(
          u.email,
          u.name || '',
          r.nomQuartier,
        ).catch((err) => {
          console.error(`[ZoneRequestsService] Error sending bulk neighborhood created email: ${err.message}`);
        });
      }
    }

    return zone;
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
      commentaireAdmin: commentaire,
      traitePar: admin._id,
      traiteLe: new Date(),
    });

    await this.userModel.findByIdAndUpdate(request.userId, {
      zoneId: zone._id,
      zoneStatut: ZoneMembershipStatus.PENDING_MEMBERSHIP,
      $unset: { refusalReason: '', refusalType: '' },
    });

    const user = await this.userModel.findById(request.userId);
    if (user && user.email) {
      this.emailsService.sendNeighborhoodCreatedEmail(
        user.email,
        user.name || '',
        request.nomQuartier,
      ).catch((err) => {
        console.error(`[ZoneRequestsService] Error sending neighborhood created email: ${err.message}`);
      });
    }

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
      refusalReason: commentaire,
      refusalType: 'zone',
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
