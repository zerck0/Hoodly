import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ContractDocument = HydratedDocument<Contract>;

export enum ContractStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema()
export class SignatureZone {
  @Prop({ type: Number, required: true })
  page!: number; // 1-indexed

  @Prop({ type: Number, required: true })
  x!: number; // position en points ou %

  @Prop({ type: Number, required: true })
  y!: number;

  @Prop({ type: Number, required: true })
  width!: number;

  @Prop({ type: Number, required: true })
  height!: number;

  @Prop({ type: String, enum: ['client', 'provider'], required: true })
  assignee!: string;
}

const SignatureZoneSchema = SchemaFactory.createForClass(SignatureZone);

@Schema()
export class SignatureDetail {
  @Prop({ default: false })
  signed!: boolean;

  @Prop()
  signedAt?: Date;

  @Prop()
  ipAddress?: string;

  @Prop()
  signatureMetadata?: string; // User-Agent

  @Prop()
  hash?: string; // Hash cryptographique certifié

  @Prop()
  signatureImage?: string; // Base64 ou URL de l'image de la signature

  @Prop({ select: false })
  otpHash?: string; // Hash de l'OTP de signature

  @Prop({ select: false })
  otpExpiresAt?: Date; // Expiration de l'OTP
}

const SignatureDetailSchema = SchemaFactory.createForClass(SignatureDetail);

@Schema({ timestamps: true })
export class Contract {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  providerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: false })
  serviceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: false })
  eventId?: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  terms!: string;

  @Prop({ required: true, default: 0 })
  pricePoints!: number;

  @Prop({ type: String, enum: ContractStatus, default: ContractStatus.PENDING })
  status!: ContractStatus;

  // Références aux Documents PDF
  @Prop({ type: Types.ObjectId, ref: 'Document', required: true })
  templateDocumentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Document', required: false })
  signedDocumentId?: Types.ObjectId;

  @Prop({ type: [SignatureZoneSchema], default: [] })
  signatureZones!: SignatureZone[];

  @Prop({ type: SignatureDetailSchema, default: () => ({ signed: false }) })
  clientSignature!: SignatureDetail;

  @Prop({ type: SignatureDetailSchema, default: () => ({ signed: false }) })
  providerSignature!: SignatureDetail;

  @Prop({ type: Boolean, default: false })
  pointsEscrowed?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

