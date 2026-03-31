import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { ZonesModule } from './modules/zones/zones.module';
import { EventsModule } from './modules/events/events.module';
import { ServicesModule } from './modules/services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    UsersModule,
    IncidentsModule,
    ZonesModule,
    EventsModule,
    ServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
