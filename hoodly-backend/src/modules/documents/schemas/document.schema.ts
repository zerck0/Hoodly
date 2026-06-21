import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DocumentDocument = HydratedDocument<Document>;

export enum DocumentType {
  JUSTIFICATIF = 'justificatif',
  CONTRACT_TEMPLATE = 'contract_template',
  SIGNED_CONTRACT = 'signed_contract',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ARCHIVED = 'archived',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  fileUrl!: string;

  @Prop({ required: true })
  pdfHash!: string;

  @Prop({ type: String, enum: DocumentType, required: true })
  type!: DocumentType;

  @Prop({ type: String, enum: DocumentStatus, default: DocumentStatus.PENDING })
  status!: DocumentStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
