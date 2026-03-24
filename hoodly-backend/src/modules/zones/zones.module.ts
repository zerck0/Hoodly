import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZonesController } from './controllers/zones.controller';
import { ZonesService } from './services/zones.service';
import { ZoneRequestsService } from './services/zone-requests.service';
import { ZoneMembershipsService } from './services/zone-memberships.service';
import { Zone, ZoneSchema } from './schemas/zone.schema';
import { ZoneRequest, ZoneRequestSchema } from './schemas/zone-request.schema';
import {
  ZoneMembership,
  ZoneMembershipSchema,
} from './schemas/zone-membership.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Zone.name, schema: ZoneSchema },
      { name: ZoneRequest.name, schema: ZoneRequestSchema },
      { name: ZoneMembership.name, schema: ZoneMembershipSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ZonesController],
  providers: [ZonesService, ZoneRequestsService, ZoneMembershipsService],
})
export class ZonesModule {}
