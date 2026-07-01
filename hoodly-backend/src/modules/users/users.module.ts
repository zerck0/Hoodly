import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { User, UserSchema } from './schemas/user.schema';
import { ModeratorApplication, ModeratorApplicationSchema } from './schemas/moderator-application.schema';
import { TransactionsModule } from '../transactions/transactions.module';
import { Conversation, ConversationSchema } from '../conversations/schemas/conversation.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ModeratorApplication.name, schema: ModeratorApplicationSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Post.name, schema: PostSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    TransactionsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
