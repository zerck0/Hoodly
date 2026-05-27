import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

export enum TransactionType {
  SERVICE_PAYMENT = 'service_payment',
  WELCOME_GRANT = 'welcome_grant',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  payerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recipientId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  serviceId?: Types.ObjectId;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: TransactionType })
  type!: TransactionType;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ payerId: 1, createdAt: -1 });
TransactionSchema.index({ recipientId: 1, createdAt: -1 });
