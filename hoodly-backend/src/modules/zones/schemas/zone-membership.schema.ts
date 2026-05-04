import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { RequestStatus } from '../enums/request-status.enum';

export type ZoneMembershipDocument = HydratedDocument<ZoneMembership>;

@Schema({ timestamps: true })
export class ZoneMembership {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Zone', required: true })
  zoneId!: Types.ObjectId;

  @Prop({ required: true })
  justificatifUrl!: string;

  @Prop({ required: true })
  pieceIdentiteUrl!: string;

  @Prop({
    type: String,
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  statut!: RequestStatus;

  @Prop()
  commentaireAdmin?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  traitePar?: Types.ObjectId;

  @Prop()
  traiteLe?: Date;
}

export const ZoneMembershipSchema =
  SchemaFactory.createForClass(ZoneMembership);
