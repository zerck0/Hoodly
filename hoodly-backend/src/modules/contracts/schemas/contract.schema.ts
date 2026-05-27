import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ContractDocument = HydratedDocument<Contract>;

export enum ContractStatus {
  PENDING = 'pending', // waiting for both parties to sign
  SIGNED = 'signed', // signed by both, active/in-progress
  COMPLETED = 'completed', // completed, points transferred
  CANCELLED = 'cancelled', // cancelled
}

@Schema()
export class SignatureDetail {
  @Prop({ default: false })
  signed!: boolean;

  @Prop()
  signedAt?: Date;

  @Prop()
  ipAddress?: string;

  @Prop()
  signatureMetadata?: string; // browser user-agent, details

  @Prop()
  hash?: string; // SHA-256 hash of the contract content + signer details
}

const SignatureDetailSchema = SchemaFactory.createForClass(SignatureDetail);

@Schema({ timestamps: true })
export class Contract {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  providerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  terms!: string;

  @Prop({ required: true, default: 0 })
  pricePoints!: number;

  @Prop({ type: String, enum: ContractStatus, default: ContractStatus.PENDING })
  status!: ContractStatus;

  @Prop({ type: SignatureDetailSchema, default: () => ({ signed: false }) })
  clientSignature!: SignatureDetail;

  @Prop({ type: SignatureDetailSchema, default: () => ({ signed: false }) })
  providerSignature!: SignatureDetail;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
