import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { ZonesModule } from './modules/zones/zones.module';
import { EventsModule } from './modules/events/events.module';
import { ServicesModule } from './modules/services/services.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PostsModule } from './modules/posts/posts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { VotesModule } from './modules/votes/votes.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EmailsModule } from './modules/emails/emails.module';
import { RgpdModule } from './modules/rgpd/rgpd.module';

import { VersionModule } from './modules/version/version.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    IncidentsModule,
    ZonesModule,
    EventsModule,
    ServicesModule,
    ConversationsModule,
    UploadsModule,
    PostsModule,
    TransactionsModule,
    VotesModule,
    ContractsModule,
    DocumentsModule,
    EmailsModule,
    RgpdModule,
    VersionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

