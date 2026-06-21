import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Contract, ContractSchema } from './schemas/contract.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { DocumentsModule } from '../documents/documents.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ConversationsModule } from '../conversations/conversations.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    UsersModule,
    TransactionsModule,
    DocumentsModule,
    UploadsModule,
    forwardRef(() => ConversationsModule),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
