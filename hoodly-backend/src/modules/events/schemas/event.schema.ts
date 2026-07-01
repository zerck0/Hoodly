import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

export enum EventStatus {
  PLANNED = 'planifié',
  ONGOING = 'en_cours',
  COMPLETED = 'terminé',
  CANCELLED = 'annulé',
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createurId!: Types.ObjectId;

  @Prop({ required: true })
  titre!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  categorie!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({
    type: Object,
    required: true,
    default: {},
  })
  lieu!: {
    adresse?: string;
    ville?: string;
    codePostal?: string;
    latitude?: number;
    longitude?: number;
  };

  @Prop({ required: true })
  capacite!: number;

  @Prop({ type: String, enum: EventStatus, default: EventStatus.PLANNED })
  statut!: EventStatus;

  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  conversationId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  interesses!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  participants!: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  payant!: boolean;

  @Prop({ type: Number })
  pointsCout?: number;

  @Prop({ type: Number, default: 0 })
  pointsCreateur!: number;

  @Prop({ type: Number, default: 0 })
  pointsParticipant!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  participantsPresents!: Types.ObjectId[];

  @Prop()
  photoUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Document' })
  templateDocumentId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
