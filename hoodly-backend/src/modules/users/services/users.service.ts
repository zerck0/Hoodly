import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UserResponseDto } from '../dto/user-response.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { TransactionType } from '../../transactions/schemas/transaction.schema';

interface ISyncPayload {
  email: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private transactionsService: TransactionsService,
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
        user = await this.userModel.findOneAndUpdate(
          { auth0Id },
          {
            $set: {
              email: payload.email,
              ...(payload.name && { name: payload.name }),
              ...(payload.picture && { picture: payload.picture }),
            },
          },
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

  async findVoisins(
    currentUserId: string,
    currentUserZoneId: string | undefined,
    search?: string,
    global = false,
  ) {
    const query: Record<string, any> = {
      _id: { $ne: currentUserId },
      isActive: true,
    };

    if (!global && currentUserZoneId) {
      query.zoneId = currentUserZoneId;
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
      zoneStatut: user.zoneStatut,
      zoneId: user.zoneId?.toString(),
      refusalReason: user.refusalReason,
      refusalType: user.refusalType,
      points: user.points ?? 100,
    };
  }
}
