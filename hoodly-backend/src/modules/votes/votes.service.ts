import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vote, VoteDocument, VoteStatus } from './schemas/vote.schema';
import { CreateVoteDto } from './dto/create-vote.dto';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class VotesService {
  constructor(
    @InjectModel(Vote.name) private readonly voteModel: Model<VoteDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    creatorId: string,
    createVoteDto: CreateVoteDto,
  ): Promise<VoteDocument> {
    const creator = await this.usersService.findById(creatorId);
    if (!creator) {
      throw new NotFoundException('Créateur introuvable');
    }

    if (!creator.zoneId || creator.zoneId.toString() !== createVoteDto.zoneId) {
      throw new ForbiddenException(
        'Vous devez appartenir à cette zone pour y créer un vote',
      );
    }

    const expirationDate = new Date(createVoteDto.expirationDate);
    if (expirationDate <= new Date()) {
      throw new BadRequestException(
        "La date d'expiration doit être dans le futur",
      );
    }

    const vote = new this.voteModel({
      zoneId: new Types.ObjectId(createVoteDto.zoneId),
      creatorId: new Types.ObjectId(creatorId),
      title: createVoteDto.title,
      description: createVoteDto.description,
      options: createVoteDto.options,
      expirationDate,
      status: VoteStatus.ACTIVE,
      votedUsers: [],
    });

    return vote.save();
  }

  async findAllByZone(zoneId: string): Promise<VoteDocument[]> {
    return this.voteModel
      .find({ zoneId: new Types.ObjectId(zoneId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<VoteDocument> {
    const vote = await this.voteModel.findById(id).exec();
    if (!vote) {
      throw new NotFoundException('Vote introuvable');
    }

    // Check expiration on the fly
    if (vote.status === VoteStatus.ACTIVE && new Date() > vote.expirationDate) {
      vote.status = VoteStatus.CLOSED;
      await vote.save();
    }

    return vote;
  }

  async vote(
    voteId: string,
    userId: string,
    option: string,
  ): Promise<VoteDocument> {
    const vote = await this.findOne(voteId);

    if (vote.status === VoteStatus.CLOSED || new Date() > vote.expirationDate) {
      if (vote.status === VoteStatus.ACTIVE) {
        vote.status = VoteStatus.CLOSED;
        await vote.save();
      }
      throw new BadRequestException('Le scrutin est clos');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (!user.zoneId || user.zoneId.toString() !== vote.zoneId.toString()) {
      throw new ForbiddenException(
        'Vous ne faites pas partie du quartier concerné par ce vote',
      );
    }

    // Prevent double voting
    const alreadyVoted = vote.votedUsers.some(
      (v) => v.userId.toString() === userId,
    );
    if (alreadyVoted) {
      throw new BadRequestException('Vous avez déjà voté pour ce scrutin');
    }

    // Verify option is valid
    if (!vote.options.includes(option)) {
      throw new BadRequestException('Option de vote invalide');
    }

    vote.votedUsers.push({
      userId: new Types.ObjectId(userId),
      option,
      votedAt: new Date(),
    });

    return vote.save();
  }

  async delete(
    voteId: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    const vote = await this.findOne(voteId);

    // Only creator or an admin/moderator can delete a vote
    if (
      vote.creatorId.toString() !== userId &&
      userRole !== 'admin' &&
      userRole !== 'moderator'
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à supprimer ce vote",
      );
    }

    await this.voteModel.findByIdAndDelete(voteId).exec();
    return { message: 'Vote supprimé avec succès' };
  }

  async close(
    voteId: string,
    userId: string,
    userRole: string,
  ): Promise<VoteDocument> {
    const vote = await this.findOne(voteId);

    // Only creator or admin/mod can close early
    if (
      vote.creatorId.toString() !== userId &&
      userRole !== 'admin' &&
      userRole !== 'moderator'
    ) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à clore ce vote");
    }

    vote.status = VoteStatus.CLOSED;
    return vote.save();
  }
}
