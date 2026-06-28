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
import { PostsService } from '../posts/posts.service';
import { PostType } from '../posts/enums/post-type.enum';
import { VotesGateway } from './votes.gateway';

@Injectable()
export class VotesService {
  constructor(
    @InjectModel(Vote.name) private readonly voteModel: Model<VoteDocument>,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly votesGateway: VotesGateway,
  ) {}

  private emitVoteUpdated(vote: any) {
    if (this.votesGateway?.server) {
      this.votesGateway.server.emit('voteUpdated', vote);
    }
  }

  async create(
    creatorId: string,
    createVoteDto: CreateVoteDto,
  ): Promise<VoteDocument> {
    const creator = await this.usersService.findById(creatorId);
    if (!creator) {
      throw new NotFoundException('Créateur introuvable');
    }

    const isModeratorOrAdmin =
      creator.role === 'moderator' || creator.role === 'admin';

    if (!isModeratorOrAdmin && (!creator.zoneId || creator.zoneId.toString() !== createVoteDto.zoneId)) {
      throw new ForbiddenException(
        'Vous devez appartenir à cette zone pour y créer un vote',
      );
    }
    const status = isModeratorOrAdmin ? VoteStatus.ACTIVE : VoteStatus.PENDING;

    // 7 jours
    const expirationDate = createVoteDto.expirationDate
      ? new Date(createVoteDto.expirationDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
      status,
      isAnonymous: createVoteDto.isAnonymous !== false,
      resultPosted: false,
      votedUsers: [],
    });

    const savedVote = await vote.save();

    if (status === VoteStatus.ACTIVE) {
      try {
        const postContent = `🗳️ Consultation : ${savedVote.title}\n\n${savedVote.description || ''}\n\nLa consultation est ouverte pour une durée d'une semaine. Donnez votre avis dans l'onglet Consultations de l'application !`;
        await this.postsService.createPost(
          savedVote.zoneId.toString(),
          creatorId,
          {
            content: postContent,
            type: PostType.DISCUSSION,
          },
        );
      } catch (error) {
        console.error('Erreur lors du post du vote actif :', error);
      }
    }

    this.emitVoteUpdated(savedVote);

    return savedVote;
  }

  async findAllByZone(
    zoneId: string,
    userId: string,
    role: string,
  ): Promise<VoteDocument[]> {
    if (role === 'moderator' || role === 'admin') {
      return this.voteModel
        .find({ zoneId: new Types.ObjectId(zoneId) })
        .sort({ createdAt: -1 })
        .exec();
    }

    return this.voteModel
      .find({
        zoneId: new Types.ObjectId(zoneId),
        $or: [
          { status: { $in: [VoteStatus.ACTIVE, VoteStatus.CLOSED] } },
          { creatorId: new Types.ObjectId(userId) },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<VoteDocument> {
    const vote = await this.voteModel.findById(id).exec();
    if (!vote) {
      throw new NotFoundException('Vote introuvable');
    }

    if (vote.status === VoteStatus.ACTIVE && new Date() > vote.expirationDate) {
      vote.status = VoteStatus.CLOSED;
      await vote.save();
      await this.postResultsToFeed(vote);
    }

    return vote;
  }

  async approve(
    voteId: string,
    moderatorId: string,
    isAnonymous?: boolean,
  ): Promise<VoteDocument> {
    const vote = await this.findOne(voteId);

    if (vote.status !== VoteStatus.PENDING) {
      throw new BadRequestException(
        "Ce vote n'est pas en attente de validation",
      );
    }

    vote.status = VoteStatus.ACTIVE;
    // 7 jours
    vote.expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (isAnonymous !== undefined) {
      vote.isAnonymous = isAnonymous;
    }

    const savedVote = await vote.save();

    try {
      const postContent = `🗳️ Consultation : ${savedVote.title}\n\n${savedVote.description || ''}\n\nLa consultation est ouverte pour une durée d'une semaine. Donnez votre avis dans l'onglet Consultations de l'application !`;
      await this.postsService.createPost(
        savedVote.zoneId.toString(),
        moderatorId,
        {
          content: postContent,
          type: PostType.DISCUSSION,
        },
      );
    } catch (error) {
      console.error(
        'Erreur lors de la publication du vote dans le feed :',
        error,
      );
    }

    this.emitVoteUpdated(savedVote);

    return savedVote;
  }

  async reject(
    voteId: string,
    moderatorId: string,
    reason: string,
  ): Promise<VoteDocument> {
    const vote = await this.findOne(voteId);

    if (vote.status !== VoteStatus.PENDING) {
      throw new BadRequestException(
        "Ce vote n'est pas en attente de validation",
      );
    }

    vote.status = VoteStatus.REJECTED;
    vote.refusalReason = reason;

    const savedVote = await vote.save();
    this.emitVoteUpdated(savedVote);

    return savedVote;
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
        await this.postResultsToFeed(vote);
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

    const alreadyVoted = vote.votedUsers.some(
      (v) => v.userId.toString() === userId,
    );
    if (alreadyVoted) {
      throw new BadRequestException('Vous avez déjà voté pour ce scrutin');
    }

    if (!vote.options.includes(option)) {
      throw new BadRequestException('Option de vote invalide');
    }

    vote.votedUsers.push({
      userId: new Types.ObjectId(userId),
      option,
      votedAt: new Date(),
    });

    const savedVote = await vote.save();
    this.emitVoteUpdated(savedVote);

    return savedVote;
  }

  async delete(
    voteId: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    const vote = await this.findOne(voteId);

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
    this.emitVoteUpdated({ _id: voteId, deleted: true });

    return { message: 'Vote supprimé avec succès' };
  }

  async close(
    voteId: string,
    userId: string,
    userRole: string,
  ): Promise<VoteDocument> {
    const vote = await this.findOne(voteId);

    if (
      vote.creatorId.toString() !== userId &&
      userRole !== 'admin' &&
      userRole !== 'moderator'
    ) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à clore ce vote");
    }

    vote.status = VoteStatus.CLOSED;
    const savedVote = await vote.save();

    await this.postResultsToFeed(savedVote, userId);
    this.emitVoteUpdated(savedVote);

    return savedVote;
  }

  private async postResultsToFeed(
    vote: VoteDocument,
    userId?: string,
  ): Promise<void> {
    if (vote.resultPosted) return;

    try {
      const totals: Record<string, number> = {};
      for (const opt of vote.options) {
        totals[opt] = 0;
      }
      for (const vu of vote.votedUsers) {
        totals[vu.option] = (totals[vu.option] || 0) + 1;
      }
      const totalVotes = vote.votedUsers.length;

      let resultSummary = `📊 Résultats de la consultation : ${vote.title}\n\n`;
      if (totalVotes === 0) {
        resultSummary += `Aucun vote n'a été enregistré pour ce scrutin.`;
      } else {
        resultSummary += `Nombre total de participants : ${totalVotes}\n\n`;
        for (const opt of vote.options) {
          const count = totals[opt] || 0;
          const pct = ((count / totalVotes) * 100).toFixed(1);
          resultSummary += `• ${opt} : ${pct}% (${count} vote(s))\n`;
        }
      }

      await this.postsService.createPost(
        vote.zoneId.toString(),
        userId || vote.creatorId.toString(),
        {
          content: resultSummary,
          type: PostType.DISCUSSION,
        },
      );

      vote.resultPosted = true;
      await vote.save();
    } catch (error) {
      console.error(
        'Erreur lors de la publication des résultats dans le feed :',
        error,
      );
    }
  }
}
