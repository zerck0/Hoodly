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

    // Verify user exists first
    const profile = await this.userModel.findById(userId).exec();
    if (!profile) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // 1. Cascade delete Posts and Comments (sensitive personal content)
    await this.postModel.deleteMany({ author: userObjectId }).exec();
    await this.commentModel.deleteMany({ author: userObjectId }).exec();

    // 2. Cascade delete Messages (sensitive communication content)
    await this.messageModel.deleteMany({ senderId: userObjectId }).exec();

    // 3. Anonymize Incident Reports (keep reports for neighborhood issues but strip personal footprints)
    await this.incidentModel
      .updateMany(
        { signaledPar: userId },
        { $set: { signaledPar: 'anonymized' } },
      )
      .exec();

    await this.incidentModel
      .updateMany({ assignedTo: userObjectId }, { $set: { assignedTo: null } })
      .exec();

    // 4. Anonymize Transactions (keep transaction record for accounting integrity but set IDs to null)
    await this.transactionModel
      .updateMany({ payerId: userObjectId }, { $set: { payerId: null } })
      .exec();

    await this.transactionModel
      .updateMany(
        { recipientId: userObjectId },
        { $set: { recipientId: null } },
      )
      .exec();

    // 5. Anonymize user profile
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

    return {
      message: 'Données anonymisées avec succès conformément aux règles RGPD.',
    };
  }
}
