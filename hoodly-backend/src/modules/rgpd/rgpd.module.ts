import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RgpdController } from './rgpd.controller';
import { RgpdService } from './rgpd.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Message,
  MessageSchema,
} from '../conversations/schemas/message.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { Comment, CommentSchema } from '../posts/schemas/comment.schema';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [RgpdController],
  providers: [RgpdService],
  exports: [RgpdService],
})
export class RgpdModule {}
