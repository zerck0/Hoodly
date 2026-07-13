import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Message,
  MessageDocument,
} from '../conversations/schemas/message.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Comment, CommentDocument } from '../posts/schemas/comment.schema';
import {
  Incident,
  IncidentDocument,
} from '../incidents/schemas/incident.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';
import { Neo4jService } from '../neo4j/neo4j.service';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class RgpdService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly neo4jService: Neo4jService,
    private readonly emailsService: EmailsService,
  ) {}

  async exportUserData(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const [profile, messages, posts, comments, incidents, transactions] =
      await Promise.all([
        this.userModel.findById(userId).lean().exec(),
        this.messageModel.find({ senderId: userObjectId }).lean().exec(),
        this.postModel.find({ author: userObjectId }).lean().exec(),
        this.commentModel.find({ author: userObjectId }).lean().exec(),
        this.incidentModel
          .find({
            $or: [{ signaledPar: userId }, { assignedTo: userObjectId }],
          })
          .lean()
          .exec(),
        this.transactionModel
          .find({
            $or: [{ payerId: userObjectId }, { recipientId: userObjectId }],
          })
          .lean()
          .exec(),
      ]);

    if (!profile) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return {
      profile,
      messages,
      posts,
      comments,
      incidents,
      transactions,
    };
  }

  async anonymizeUserData(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const profile = await this.userModel.findById(userId).exec();
    if (!profile) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (profile.email && !profile.email.startsWith('anonymized-')) {
      try {
        await this.emailsService.sendAccountDeletedEmail(profile.email, profile.name || '');
      } catch (err: any) {
        console.error(`[RgpdService] Error sending account deleted email: ${err.message}`);
      }
    }

    await this.postModel.deleteMany({ author: userObjectId }).exec();
    await this.commentModel.deleteMany({ author: userObjectId }).exec();

    await this.messageModel.deleteMany({ senderId: userObjectId }).exec();

    await this.incidentModel
      .updateMany(
        { signaledPar: userId },
        { $set: { signaledPar: 'anonymized' } },
      )
      .exec();

    await this.incidentModel
      .updateMany({ assignedTo: userObjectId }, { $set: { assignedTo: null } })
      .exec();

    await this.transactionModel
      .updateMany({ payerId: userObjectId }, { $set: { payerId: null } })
      .exec();

    await this.transactionModel
      .updateMany(
        { recipientId: userObjectId },
        { $set: { recipientId: null } },
      )
      .exec();

    await this.userModel
      .findByIdAndUpdate(userId, {
        $set: {
          email: `anonymized-${userId}@hoodly.local`,
          name: 'Utilisateur Anonymisé',
          picture: '',
          phone: '',
          auth0Id: `anonymized-${userId}`,
          isActive: false,
          points: 0,
          location: undefined,
        },
      })
      .exec();

    try {
      await this.neo4jService.run(
        'MATCH (u:User {id: $userId}) DETACH DELETE u',
        { userId },
      );
    } catch (err) {
      console.error('Neo4j cleanup failed during anonymization:', err);
    }
    return {
      message: 'Données anonymisées avec succès conformément aux règles RGPD.',
    };
  }
}
