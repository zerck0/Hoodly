import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ZoneStatus } from '../enums/zone-status.enum';

export type ZoneDocument = HydratedDocument<Zone>;

@Schema({ timestamps: true })
export class Zone {
  @Prop({ required: true })
  nom!: string;

  @Prop({ required: true })
  ville!: string;

  @Prop({ type: Object })
  polygone?: {
    type: string;
    coordinates: number[][][];
  };

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdPar?: Types.ObjectId;

  @Prop({ type: String, enum: ZoneStatus, default: ZoneStatus.ACTIVE })
  statut!: ZoneStatus;

  @Prop({ default: 0 })
  membresCount!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ZoneSchema = SchemaFactory.createForClass(Zone);

// Index géospatial pour le champ polygone
ZoneSchema.index({ polygone: '2dsphere' });
