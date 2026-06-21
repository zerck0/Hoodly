import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesService } from './services/services.service';
import { ServicesController } from './controllers/services.controller';
import { Service, ServiceSchema } from './schemas/service.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ConversationsModule } from '../conversations/conversations.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => ConversationsModule),
    TransactionsModule,
    forwardRef(() => ContractsModule),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
