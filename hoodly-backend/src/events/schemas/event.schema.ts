import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

export enum EventStatus {
  PLANNED = 'planifié',
  ONGOING = 'en_cours',
  COMPLETED = 'terminé',
  CANCELLED = 'annulé',
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  titre!: string;

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

  createdAt?: Date;
  updatedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
