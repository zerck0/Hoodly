import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

export class CommentAuthorSnapshot {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  avatar: string;
}

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: CommentAuthorSnapshot, required: true })
  authorSnapshot: CommentAuthorSnapshot;

  @Prop({ required: true, maxlength: 1000 })
  content: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ post: 1, createdAt: 1 });
