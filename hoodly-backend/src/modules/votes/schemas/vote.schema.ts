import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VoteDocument = HydratedDocument<Vote>;

export enum VoteStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class Vote {
  @Prop({ type: Types.ObjectId, ref: 'Zone', required: true })
  zoneId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], required: true })
  options!: string[];

  @Prop({ required: true })
  expirationDate!: Date;

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        option: { type: String, required: true },
        votedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  votedUsers!: { userId: Types.ObjectId; option: string; votedAt?: Date }[];

  @Prop({ type: String, enum: VoteStatus, default: VoteStatus.ACTIVE })
  status!: VoteStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);
