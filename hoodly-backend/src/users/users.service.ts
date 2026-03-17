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

  // Crée ou met à jour un user après login Auth0
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
        { upsert: true, new: true },
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

  async findByAuth0Id(auth0Id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ auth0Id });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  private toDto(user: UserDocument): UserResponseDto {
    return {
      id: (user._id as unknown as string).toString(),
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
    };
  }
}
