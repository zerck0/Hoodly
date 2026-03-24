import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';

export type IncidentDocument = HydratedDocument<Incident>;

@Schema({ timestamps: true })
export class Incident {
  @ApiProperty({ description: 'ID MongoDB' })
  _id!: string;

  @ApiProperty({ description: "Type d'incident" })
  @Prop({ required: true })
  type!: string;

  @ApiProperty({ description: 'Description' })
  @Prop({ required: true })
  description!: string;

  @ApiPropertyOptional({ description: 'URL de la photo' })
  @Prop()
  photoUrl?: string;

  @ApiProperty({ description: 'Statut', enum: IncidentStatus })
  @Prop({
    type: String,
    enum: IncidentStatus,
    required: true,
    default: IncidentStatus.REPORTED,
  })
  statut!: IncidentStatus;

  @ApiProperty({ description: 'Priorité', enum: IncidentPriority })
  @Prop({
    type: String,
    enum: IncidentPriority,
    required: true,
    default: IncidentPriority.NORMAL,
  })
  priorite!: IncidentPriority;

  @ApiPropertyOptional({ description: 'ID du signaleur' })
  @Prop()
  signaledPar?: string;

  @ApiPropertyOptional({ description: 'ID de la zone' })
  @Prop({ type: Types.ObjectId, ref: 'Zone' })
  zoneId?: Types.ObjectId;

  @ApiProperty({ description: 'Date de création' })
  createdAt?: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt?: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
