import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ServiceType {
  OFFRE = 'offre',
  DEMANDE = 'demande',
}

export enum ServiceStatus {
  ACTIF = 'actif',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ANNULE = 'annule',
}

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true })
  titre!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: ServiceType })
  type!: ServiceType;

  @Prop({ required: true })
  categorie!: string;

  @Prop({ required: true, default: true })
  gratuit!: boolean;

  @Prop()
  points?: number;

  @Prop({
    type: String,
    enum: ServiceStatus,
    default: ServiceStatus.ACTIF,
  })
  statut!: ServiceStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createurId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Zone', required: true })
  zoneId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  responderId?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  refusedResponders!: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  realisationValidee!: boolean;

  @Prop({ type: Boolean })
  recurrente?: boolean;

  @Prop({ type: [String] })
  disponibilites?: string[];

  @Prop()
  datePlanification?: string;

  @Prop({ type: Types.ObjectId, ref: 'Contract' })
  contractId?: Types.ObjectId;

  @Prop()
  photoUrl?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

ServiceSchema.index({ zoneId: 1, statut: 1, createdAt: -1 });
ServiceSchema.index({ titre: 'text', description: 'text', categorie: 'text' });
