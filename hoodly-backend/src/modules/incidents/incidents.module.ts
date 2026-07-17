import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IncidentsController } from './controllers/incidents.controller';
import { IncidentsService } from './services/incidents.service';
import { Incident, IncidentSchema } from './schemas/incident.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
})
export class IncidentsModule {}
