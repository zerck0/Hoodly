import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
} from '../schemas/transaction.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
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
