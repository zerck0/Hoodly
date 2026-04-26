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

    // On met à jour la position de l'utilisateur sur son profil également
    await this.userModel.findByIdAndUpdate(user._id, {
      zoneStatut: ZoneMembershipStatus.PENDING_ZONE,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
      $unset: { refusalReason: "", refusalType: "" },
    });

    return request.save();
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

    // 1. Créer la zone
    const zone = new this.zoneModel({
      nom: data.nomQuartier,
      ville: data.ville,
      polygone: data.polygone,
      createdPar: admin._id,
    });
    await zone.save();

    // 2. Mettre à jour toutes les demandes
    await this.zoneRequestModel.updateMany(
      { _id: { $in: data.requestIds } },
      {
        statut: RequestStatus.ACCEPTED,
        commentaireAdmin: data.commentaire,
        traitePar: admin._id,
        traiteLe: new Date(),
      },
    );

    // 3. Mettre à jour les utilisateurs concernés
    // On récupère les demandes pour avoir les IDs des users
    const requests = await this.zoneRequestModel.find({
      _id: { $in: data.requestIds },
    });
    const userIds = requests.map((r) => r.userId);

    await this.userModel.updateMany(
      { _id: { $in: userIds } },
      {
        zoneId: zone._id,
        zoneStatut: ZoneMembershipStatus.PENDING_MEMBERSHIP, // Ils doivent maintenant valider leurs docs
      },
    );

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

    // On passe l'initiateur en attente de validation de ses propres documents
    // pour le nouveau quartier créé.
    await this.userModel.findByIdAndUpdate(request.userId, {
      zoneId: zone._id,
      zoneStatut: ZoneMembershipStatus.PENDING_MEMBERSHIP,
      $unset: { refusalReason: "", refusalType: "" },
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
