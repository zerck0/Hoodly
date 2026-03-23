import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserResponseDto } from '../auth/dto/user-response.dto';

interface ISyncPayload {
  email: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Crée || met à jour un user après login Auth0
  async syncFromAuth0(
    auth0Id: string,
    payload: ISyncPayload,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userModel.findOneAndUpdate(
        { auth0Id },
        {
          $set: {
            email: payload.email,
            ...(payload.name && { name: payload.name }),
            ...(payload.picture && { picture: payload.picture }),
          },
          $setOnInsert: { role: 'user', isActive: true },
        },
        { upsert: true, returnDocument: 'after' },
      );
      return this.toDto(user);
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
  ) {
    // Filtre de recherche
    const query = this.buildSearchQuery(search, role, isActive);

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(), // .lean() pour de meilleures performances
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

  private buildSearchQuery(search?: string, role?: string, isActive?: boolean) {
    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;
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
    };
  }
}
