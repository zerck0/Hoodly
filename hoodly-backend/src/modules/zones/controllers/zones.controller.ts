import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZonesService } from '../services/zones.service';
import { ZoneRequestsService } from '../services/zone-requests.service';
import { ZoneMembershipsService } from '../services/zone-memberships.service';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/schemas/user.schema';
import { MongoIdValidationPipe } from '../../../shared/pipes/mongo-id-validation.pipe';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { CreateZoneRequestDto } from '../dto/create-zone-request.dto';
import { CreateMembershipDto } from '../dto/create-membership.dto';
import { AdminActionDto } from '../dto/admin-action.dto';
import type { JwtPayloadDto } from '../../../core/auth/dto/jwt-payload.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('zones')
export class ZonesController {
  constructor(
    private readonly zonesService: ZonesService,
    private readonly zoneRequestsService: ZoneRequestsService,
    private readonly zoneMembershipsService: ZoneMembershipsService,
  ) {}

  @Get()
  findAll() {
    return this.zonesService.findAll();
  }

  @Get('search')
  search(@Query('nom') nom: string, @Query('ville') ville: string) {
    return this.zonesService.search(nom, ville);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() body: CreateZoneDto, @CurrentUser() user: JwtPayloadDto) {
    return this.zonesService.create(body, user.sub);
  }

  @Post('requests')
  createZoneRequest(
    @Body() body: CreateZoneRequestDto,
    @CurrentUser() user: JwtPayloadDto,
  ) {
    return this.zoneRequestsService.create(body, user.sub);
  }

  @Get('requests')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  findAllZoneRequests() {
    return this.zoneRequestsService.findAll();
  }

  @Put('requests/:id/accept')
  @Roles(UserRole.ADMIN)
  acceptZoneRequest(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: JwtPayloadDto,
    @Body() body: AdminActionDto,
  ) {
    return this.zoneRequestsService.accept(
      id,
      user.sub,
      body.commentaire ?? undefined,
    );
  }

  @Put('requests/:id/refuse')
  @Roles(UserRole.ADMIN)
  refuseZoneRequest(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: JwtPayloadDto,
    @Body() body: AdminActionDto,
  ) {
    return this.zoneRequestsService.refuse(
      id,
      user.sub,
      body.commentaire ?? '',
    );
  }

  @Post('memberships')
  createMembership(
    @Body() body: CreateMembershipDto,
    @CurrentUser() user: JwtPayloadDto,
  ) {
    return this.zoneMembershipsService.create(
      body.zoneId,
      user.sub,
      body.justificatifUrl,
      body.pieceIdentiteUrl,
    );
  }

  @Get('memberships')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  findAllMemberships() {
    return this.zoneMembershipsService.findAll();
  }

  @Put('memberships/:id/accept')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  acceptMembership(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: JwtPayloadDto,
  ) {
    return this.zoneMembershipsService.accept(id, user.sub);
  }

  @Put('memberships/:id/refuse')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  refuseMembership(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: JwtPayloadDto,
    @Body() body: AdminActionDto,
  ) {
    return this.zoneMembershipsService.refuse(
      id,
      user.sub,
      body.commentaire ?? '',
    );
  }
}
