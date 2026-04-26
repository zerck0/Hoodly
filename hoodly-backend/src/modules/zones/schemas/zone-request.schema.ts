import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { RequestStatus } from '../enums/request-status.enum';

export type ZoneRequestDocument = HydratedDocument<ZoneRequest>;

@Schema({ timestamps: true })
export class ZoneRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  nomQuartier!: string;

  @Prop({ required: true })
  ville!: string;

  @Prop({ required: true })
  codePostal!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location!: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type: String,
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  statut!: RequestStatus;

  @Prop()
  commentaireAdmin?: string; // Commentaire de l'admin en cas de refus

  @Prop({ type: Types.ObjectId, ref: 'User' })
  traitePar?: Types.ObjectId;

  @Prop()
  traiteLe?: Date;
}

export const ZoneRequestSchema = SchemaFactory.createForClass(ZoneRequest);

// Index géospatial pour le champ location
ZoneRequestSchema.index({ location: '2dsphere' });
