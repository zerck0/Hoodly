import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PostType } from '../enums/post-type.enum';

export type PostDocument = Post & Document;

export class AuthorSnapshot {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  avatar: string;
}

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: AuthorSnapshot, required: true })
  authorSnapshot: AuthorSnapshot;

  @Prop({ type: Types.ObjectId, ref: 'Zone', required: true })
  zone: Types.ObjectId;

  @Prop({ required: true, maxlength: 1000 })
  content: string;

  @Prop({ type: [String], default: [] })
  media: string[];

  @Prop({
    type: String,
    enum: PostType,
    required: true,
    default: PostType.DISCUSSION,
  })
  type: PostType;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ zone: 1, createdAt: -1 });
