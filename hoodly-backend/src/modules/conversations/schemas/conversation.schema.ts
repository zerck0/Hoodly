import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Service' })
  serviceId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants!: Types.ObjectId[];

  @Prop({ type: String, enum: ['active', 'archived'], default: 'active' })
  statut!: 'active' | 'archived';

  @Prop({
    type: String,
    enum: ['aucun', 'valide', 'en_cours', 'termine', 'refuse'],
    default: 'aucun',
  })
  prestationStatut!: 'aucun' | 'valide' | 'en_cours' | 'termine' | 'refuse';

  @Prop({ type: Boolean, default: false })
  realisationValidee!: boolean;

  @Prop({
    type: {
      date: Date,
      debut: String,
      fin: String,
      statut: {
        type: String,
        enum: ['en_attente', 'confirme', 'annule'],
        default: 'en_attente',
      },
    },
    required: false,
  })
  creneau?: {
    date: Date;
    debut: string;
    fin: string;
    statut: 'en_attente' | 'confirme' | 'annule';
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ serviceId: 1 });
ConversationSchema.index({ participants: 1 });
