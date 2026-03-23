import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';

export type IncidentDocument = HydratedDocument<Incident>;

@Schema({ timestamps: true })
export class Incident {
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  description!: string;

  @Prop()
  photoUrl?: string;

  @Prop({
    type: String,
    enum: IncidentStatus,
    required: true,
    default: IncidentStatus.REPORTED,
  })
  statut!: IncidentStatus;

  @Prop({
    type: String,
    enum: IncidentPriority,
    required: true,
    default: IncidentPriority.NORMAL,
  })
  priorite!: IncidentPriority;

  @Prop()
  signaledPar?: string;

  @Prop({ type: Types.ObjectId, ref: 'Zone' })
  zoneId?: Types.ObjectId;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
