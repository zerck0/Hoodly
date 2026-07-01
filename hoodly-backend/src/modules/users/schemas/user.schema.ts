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

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  birthDate?: string;

  @Prop()
  civility?: string;

  @Prop({ type: [String] })
  interests?: string[];

  @Prop()
  material?: string;

  @Prop()
  residentType?: string;

  @Prop()
  languages?: string;

  @Prop({ default: 100 })
  points!: number;

  @Prop({ type: Object })
  location?: {
    type: string;
    coordinates: number[];
  };

  @Prop()
  bio?: string;

  @Prop()
  refusalReason?: string;

  @Prop({ type: String, enum: ['zone', 'membership'] })
  refusalType?: 'zone' | 'membership';

  @Prop({ type: [String], default: [] })
  claimedMissions!: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
