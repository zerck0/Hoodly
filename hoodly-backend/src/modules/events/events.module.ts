import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { Event, EventSchema } from './schemas/event.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ConversationsModule } from '../conversations/conversations.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ConversationsModule,
    TransactionsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
