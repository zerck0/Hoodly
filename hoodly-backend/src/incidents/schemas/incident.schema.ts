import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IncidentDocument = HydratedDocument<Incident>;

@Schema({ timestamps: true })
export class Incident {
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  description!: string;

  @Prop()
  photoUrl?: string;

  @Prop({ required: true, default: 'signale' })
  statut!: string;

  @Prop({ required: true, default: 'normale' })
  priorite!: string;

  @Prop()
  signaledPar?: string;

  @Prop()
  zoneId?: string;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
