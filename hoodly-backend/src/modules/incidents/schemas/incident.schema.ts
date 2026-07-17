import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';

export enum IncidentContext {
  QUARTIER = 'quartier',
  SERVICE = 'service',
  EVENEMENT = 'evenement',
}

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

  @ApiProperty({ description: "Contexte de l'incident", enum: IncidentContext })
  @Prop({
    type: String,
    enum: IncidentContext,
    required: true,
    default: IncidentContext.QUARTIER,
  })
  contexte!: IncidentContext;

  @ApiPropertyOptional({ description: 'ID du service associé' })
  @Prop({ type: Types.ObjectId, ref: 'Service' })
  serviceId?: Types.ObjectId;

  @ApiPropertyOptional({ description: "ID de l'événement associé" })
  @Prop({ type: Types.ObjectId, ref: 'Event' })
  eventId?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'ID du signaleur' })
  @Prop({ type: String })
  signaledPar?: string;

  @ApiPropertyOptional({ description: 'ID de la zone' })
  @Prop({ type: Types.ObjectId, ref: 'Zone' })
  zoneId?: Types.ObjectId;

  @ApiPropertyOptional({ description: "ID de l'utilisateur assigné" })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Commentaire de résolution' })
  @Prop()
  resolutionComment?: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt?: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt?: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);

IncidentSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret) => {
    ret._id = ret._id?.toString();
    return ret;
  },
});
