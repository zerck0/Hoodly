import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import {
  ModeratorApplication,
  ModeratorApplicationDocument,
  ApplicationStatus,
} from '../schemas/moderator-application.schema';
import { UserResponseDto } from '../dto/user-response.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { EmailsService } from '../../emails/emails.service';
import { TransactionType } from '../../transactions/schemas/transaction.schema';
import {
  Conversation,
  ConversationDocument,
} from '../../conversations/schemas/conversation.schema';
import { Post, PostDocument } from '../../posts/schemas/post.schema';
import {
  Incident,
  IncidentDocument,
} from '../../incidents/schemas/incident.schema';
import { Event, EventDocument } from '../../events/schemas/event.schema';

interface ISyncPayload {
  email: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ModeratorApplication.name)
    private moderatorApplicationModel: Model<ModeratorApplicationDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private transactionsService: TransactionsService,
    private readonly emailsService: EmailsService,
  ) {}

  async syncFromAuth0(
    auth0Id: string,
    payload: ISyncPayload,
  ): Promise<UserResponseDto> {
    try {
      let user = await this.userModel.findOne({ auth0Id });
      const isNewUser = !user;

      if (isNewUser) {
        user = new this.userModel({
          auth0Id,
          email: payload.email,
          ...(payload.name && { name: payload.name }),
          ...(payload.picture && { picture: payload.picture }),
          role: 'user',
          isActive: true,
          points: 100,
        });
        await user.save();

        try {
          await this.transactionsService.create(
            null,
            String(user._id),
            100,
            TransactionType.WELCOME_GRANT,
            'Cadeau de Bienvenue Hoodly',
          );
        } catch {
          console.warn('Could not save welcome transaction');
        }
      } else {
        const updatePayload: any = { email: payload.email };
        if (!user!.name && payload.name) {
          updatePayload.name = payload.name;
        }
        if (!user!.picture && payload.picture) {
          updatePayload.picture = payload.picture;
        }

        user = await this.userModel.findOneAndUpdate(
          { auth0Id },
          { $set: updatePayload },
          { returnDocument: 'after' },
        );
      }

      return this.toDto(user!);
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la synchronisation du profil',
      );
    }
  }

  async getProfileByAuth0Id(auth0Id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findOne({ auth0Id });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.toDto(user);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    role?: string,
    isActive?: boolean,
    zoneStatut?: string,
  ) {
    const query = this.buildSearchQuery(search, role, isActive, zoneStatut);

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users: users.map((u) => this.toDto(u as UserDocument)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private buildSearchQuery(
    search?: string,
    role?: string,
    isActive?: boolean,
    zoneStatut?: string,
  ) {
    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;
    if (zoneStatut) query.zoneStatut = zoneStatut;
    return query;
  }

  async updateUser(id: string, updates: { role?: string; isActive?: boolean }) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after' },
    );
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.toDto(user);
  }

  async deleteUser(id: string) {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Utilisateur introuvable');

    if (result.email && !result.email.startsWith('anonymized-')) {
      this.emailsService.sendAccountDeletedEmail(result.email, result.name || '').catch((err) => {
        console.error(`[UsersService] Error sending account deleted email: ${err.message}`);
      });
    }

    return { message: 'Utilisateur supprimé' };
  }

  async updateProfile(
    auth0Id: string,
    updates: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.userModel.findOneAndUpdate(
      { auth0Id },
      { $set: updates },
      { returnDocument: 'after' },
    );
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.toDto(user);
  }

  async claimMission(
    auth0Id: string,
    missionId: string,
  ): Promise<UserResponseDto> {
    const user = await this.userModel.findOne({ auth0Id });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const claimed = user.claimedMissions || [];
    if (claimed.includes(missionId)) {
      throw new BadRequestException(
        'Vous avez déjà récupéré la récompense pour cette mission.',
      );
    }

    let isCompleted = false;
    let pointsReward = 0;
    let missionTitle = '';

    const userIdStr = String(user._id);

    if (missionId === 'discussion') {
      pointsReward = 10;
      missionTitle = 'Discussion active';
      const convCount = await this.conversationModel.countDocuments({
        participants: new Types.ObjectId(userIdStr),
      });
      isCompleted = convCount > 0;
    } else if (missionId === 'first_post') {
      pointsReward = 15;
      missionTitle = 'Premier pas sur le feed';
      const postCount = await this.postModel.countDocuments({
        author: new Types.ObjectId(userIdStr),
      });
      isCompleted = postCount > 0;
    } else if (missionId === 'first_incident') {
      pointsReward = 10;
      missionTitle = 'Signalement civique';
      const incidentCount = await this.incidentModel.countDocuments({
        $or: [{ signaledPar: user.name }, { signaledPar: user.email }].filter(
          (cond) => cond.signaledPar,
        ),
      });
      isCompleted = incidentCount > 0;
    } else if (missionId === 'create_event') {
      pointsReward = 20;
      missionTitle = 'Organisateur de quartier';
      const eventCount = await this.eventModel.countDocuments({
        createurId: new Types.ObjectId(userIdStr),
      });
      isCompleted = eventCount > 0;
    } else if (missionId === 'join_event') {
      pointsReward = 10;
      missionTitle = "Esprit d'équipe";
      const participationCount = await this.eventModel.countDocuments({
        participants: new Types.ObjectId(userIdStr),
      });
      isCompleted = participationCount > 0;
    } else {
      throw new BadRequestException('Mission inconnue.');
    }

    if (!isCompleted) {
      throw new BadRequestException(
        "Vous n'avez pas encore accompli les conditions pour cette mission.",
      );
    }

    user.points = (user.points || 0) + pointsReward;
    if (!user.claimedMissions) {
      user.claimedMissions = [];
    }
    user.claimedMissions.push(missionId);
    await user.save();

    try {
      await this.transactionsService.create(
        null,
        userIdStr,
        pointsReward,
        TransactionType.ADMIN_ADJUSTMENT,
        `Mission accomplie : ${missionTitle}`,
      );
    } catch (err) {
      console.warn('Could not record transaction for mission claim:', err);
    }

    return this.toDto(user);
  }

  async findVoisins(
    currentUserId: string,
    currentUserZoneId: string | undefined,
    search?: string,
    global = false,
  ) {
    const query: Record<string, any> = {
      _id: {
        $ne: Types.ObjectId.isValid(currentUserId)
          ? new Types.ObjectId(currentUserId)
          : currentUserId,
      },
      isActive: true,
    };

    if (
      !global &&
      currentUserZoneId &&
      Types.ObjectId.isValid(currentUserZoneId)
    ) {
      query.zoneId = new Types.ObjectId(currentUserZoneId);
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await this.userModel.find(query).limit(20).lean();
    return users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      picture: u.picture,
      zoneId: u.zoneId ? String(u.zoneId) : undefined,
    }));
  }

  private toDto(user: UserDocument): UserResponseDto {
    return {
      id: (user._id as unknown as string).toString(),
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      civility: user.civility,
      interests: user.interests,
      material: user.material,
      residentType: user.residentType,
      languages: user.languages,
      zoneStatut: user.zoneStatut,
      zoneId: user.zoneId?.toString(),
      refusalReason: user.refusalReason,
      refusalType: user.refusalType,
      points: user.points ?? 100,
      bio: user.bio,
      claimedMissions: user.claimedMissions || [],
    };
  }

  async updatePoints(id: string, amount: number): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (amount < 0 && (user.points ?? 100) < Math.abs(amount)) {
      throw new BadRequestException(
        `Solde de points insuffisant (${user.points ?? 100} pts) pour débiter ${Math.abs(amount)} pts.`,
      );
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $inc: { points: amount } },
      { new: true },
    );
    if (!updatedUser) throw new NotFoundException('Utilisateur introuvable');
    return updatedUser;
  }

  async applyForModerator(
    userId: string,
    motivation: string,
  ): Promise<ModeratorApplicationDocument> {
    const existing = await this.moderatorApplicationModel.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: [ApplicationStatus.PENDING, ApplicationStatus.APPROVED] },
    });

    if (existing) {
      if (existing.status === ApplicationStatus.APPROVED) {
        throw new BadRequestException('Vous etes deja modérateur.');
      }
      throw new BadRequestException('Vous avez deja une demande en attente.');
    }

    const application = new this.moderatorApplicationModel({
      userId: new Types.ObjectId(userId),
      motivation,
      status: ApplicationStatus.PENDING,
    });
    return application.save();
  }

  async getLatestModeratorApplication(
    userId: string,
  ): Promise<ModeratorApplicationDocument | null> {
    return this.moderatorApplicationModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllModeratorApplications(): Promise<ModeratorApplicationDocument[]> {
    return this.moderatorApplicationModel
      .find()
      .populate('userId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async decideModeratorApplication(
    applicationId: string,
    approved: boolean,
  ): Promise<ModeratorApplicationDocument> {
    const app = await this.moderatorApplicationModel.findById(applicationId);
    if (!app) {
      throw new NotFoundException('Candidature introuvable');
    }

    if (app.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Cette candidature a deja ete traitee.');
    }

    app.status = approved
      ? ApplicationStatus.APPROVED
      : ApplicationStatus.REJECTED;
    const savedApp = await app.save();

    if (approved) {
      await this.userModel.findByIdAndUpdate(app.userId, {
        $set: { role: 'moderator' },
      });
    }

    return savedApp;
  }
}
