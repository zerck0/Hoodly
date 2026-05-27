import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
} from '../schemas/transaction.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(
    payerId: string | null,
    recipientId: string | null,
    amount: number,
    type: TransactionType,
    description: string,
    serviceId?: string,
  ): Promise<TransactionDocument> {
    try {
      const newTransaction = new this.transactionModel({
        ...(payerId && { payerId: new Types.ObjectId(payerId) }),
        ...(recipientId && { recipientId: new Types.ObjectId(recipientId) }),
        amount,
        type,
        description,
        ...(serviceId && { serviceId: new Types.ObjectId(serviceId) }),
      });
      return await newTransaction.save();
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la création de la transaction',
      );
    }
  }

  async transferPoints(
    payerId: string,
    recipientId: string,
    amount: number,
    description: string,
    serviceId?: string,
  ): Promise<TransactionDocument> {
    const payer = await this.userModel.findById(payerId);
    if (!payer) {
      throw new NotFoundException('Payeur introuvable');
    }
    if (payer.points < amount) {
      throw new BadRequestException(
        `Solde de points insuffisant (${payer.points} pts) pour régler cette prestation (${amount} pts).`,
      );
    }

    const updatedPayer = await this.userModel.findOneAndUpdate(
      { _id: payerId, points: { $gte: amount } },
      { $inc: { points: -amount } },
      { new: true },
    );

    if (!updatedPayer) {
      throw new BadRequestException(
        'Le solde de points a changé ou est insuffisant lors de la transaction.',
      );
    }

    let updatedRecipient;
    try {
      updatedRecipient = await this.userModel.findByIdAndUpdate(
        recipientId,
        { $inc: { points: amount } },
        { new: true },
      );
      if (!updatedRecipient) {
        throw new NotFoundException('Bénéficiaire introuvable');
      }
    } catch (err) {
      await this.userModel.findByIdAndUpdate(payerId, {
        $inc: { points: amount },
      });
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Erreur lors du crédit du bénéficiaire. La transaction a été annulée.',
      );
    }

    try {
      const newTransaction = new this.transactionModel({
        payerId: new Types.ObjectId(payerId),
        recipientId: new Types.ObjectId(recipientId),
        amount,
        type: TransactionType.SERVICE_PAYMENT,
        description,
        ...(serviceId && { serviceId: new Types.ObjectId(serviceId) }),
      });
      return await newTransaction.save();
    } catch (err) {
      await this.userModel.findByIdAndUpdate(recipientId, {
        $inc: { points: -amount },
      });
      await this.userModel.findByIdAndUpdate(payerId, {
        $inc: { points: amount },
      });

      throw new InternalServerErrorException(
        'Erreur lors de la création du document de transaction. Les points ont été restitués.',
      );
    }
  }

  async findAllForUser(userId: string): Promise<TransactionDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    return this.transactionModel
      .find({
        $or: [{ payerId: userObjectId }, { recipientId: userObjectId }],
      })
      .sort({ createdAt: -1 })
      .populate('payerId', 'name email picture')
      .populate('recipientId', 'name email picture')
      .populate('serviceId', 'titre categorie gratuit points')
      .exec();
  }
}
