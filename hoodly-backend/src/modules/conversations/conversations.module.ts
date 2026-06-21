import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationsController } from './controllers/conversations.controller';
import { ConversationsService } from './services/conversations.service';
import { ConversationsGateway } from './gateways/conversations.gateway';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ContractsModule } from '../contracts/contracts.module';
import { DocumentsModule } from '../documents/documents.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => ServicesModule),
    UsersModule,
    forwardRef(() => ContractsModule),
    DocumentsModule,
    UploadsModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsGateway],
  exports: [ConversationsService, ConversationsGateway],
})
export class ConversationsModule {}
