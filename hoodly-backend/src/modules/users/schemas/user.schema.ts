import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ZoneMembershipStatus } from '../enums/zone-membership-status.enum';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  auth0Id!: string;

  @Prop({ required: true })
  email!: string;

  @Prop()
  name?: string;

  @Prop()
  picture?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: String,
    enum: ZoneMembershipStatus,
    default: ZoneMembershipStatus.NO_ZONE,
  })
  zoneStatut!: ZoneMembershipStatus;

  @Prop({ type: Types.ObjectId, ref: 'Zone' })
  zoneId?: Types.ObjectId;

  @Prop()
  phone?: string;

  @Prop({ type: Object })
  location?: {
    type: string;
    coordinates: number[];
  };

  @Prop()
  refusalReason?: string;

  @Prop({ type: String, enum: ['zone', 'membership'] })
  refusalType?: 'zone' | 'membership';
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index géospatial commenté temporairement pour débloquer l'inscription
// UserSchema.index({ location: '2dsphere' });
