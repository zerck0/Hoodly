import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ZonesService } from './zones.service';
import { Zone } from '../schemas/zone.schema';
import { User } from '../../users/schemas/user.schema';
import { ZoneMembership } from '../schemas/zone-membership.schema';
import { Incident } from '../../incidents/schemas/incident.schema';
import { Event } from '../../events/schemas/event.schema';
import { Service } from '../../services/schemas/service.schema';
import { ZoneStatus } from '../enums/zone-status.enum';
import { ZoneMembershipStatus } from '../../users/enums/zone-membership-status.enum';

describe('ZonesService', () => {
  let service: ZonesService;
  let zoneModel: jest.Mock & {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };
  let userModel: {
    findOne: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let incidentModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let eventModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let serviceModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
  };

  const zoneId = '507f191e810c19729de860aa';

  const makeZone = (overrides: Record<string, unknown> = {}) => {
    const now = new Date('2026-01-01T10:00:00.000Z');

    return {
      _id: new Types.ObjectId(zoneId),
      nom: 'Belleville',
      ville: 'Paris',
      polygone: {
        type: 'Polygon',
        coordinates: [
          [
            [2.38, 48.86],
            [2.39, 48.86],
            [2.39, 48.87],
            [2.38, 48.86],
          ],
        ],
      },
      createdPar: new Types.ObjectId('507f191e810c19729de860ab'),
      statut: ZoneStatus.ACTIVE,
      membresCount: 12,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  };

  const toExpectedDto = (zone: ReturnType<typeof makeZone>) => ({
    id: zone._id.toString(),
    nom: zone.nom,
    ville: zone.ville,
    polygone: zone.polygone,
    createdPar: zone.createdPar?.toString(),
    statut: zone.statut,
    membresCount: zone.membresCount,
    createdAt: zone.createdAt?.toISOString(),
    updatedAt: zone.updatedAt?.toISOString(),
  });

  beforeEach(async () => {
    const zoneModelConstructor = jest.fn();
    zoneModel = zoneModelConstructor as jest.Mock & {
      find: jest.Mock;
      countDocuments: jest.Mock;
      findById: jest.Mock;
      findByIdAndUpdate: jest.Mock;
    };
    zoneModel.find = jest.fn();
    zoneModel.countDocuments = jest.fn();
    zoneModel.findById = jest.fn();
    zoneModel.findByIdAndUpdate = jest.fn();

    userModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    incidentModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    eventModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    serviceModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonesService,
        {
          provide: getModelToken(Zone.name),
          useValue: zoneModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: getModelToken(ZoneMembership.name),
          useValue: {},
        },
        {
          provide: getModelToken(Incident.name),
          useValue: incidentModel,
        },
        {
          provide: getModelToken(Event.name),
          useValue: eventModel,
        },
        {
          provide: getModelToken(Service.name),
          useValue: serviceModel,
        },
      ],
    }).compile();

    service = module.get<ZonesService>(ZonesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllPaginated', () => {
    it('should return paginated zones with search filter', async () => {
      const zoneA = makeZone();
      const zoneB = makeZone({
        _id: new Types.ObjectId('507f191e810c19729de860ac'),
        nom: 'Maraichers',
      });

      const exec = jest.fn().mockResolvedValue([zoneA, zoneB]);
      const sort = jest.fn().mockReturnValue({ exec });
      const limit = jest.fn().mockReturnValue({ sort });
      const skip = jest.fn().mockReturnValue({ limit });

      zoneModel.find.mockReturnValue({ skip });
      zoneModel.countDocuments.mockResolvedValue(22);

      const result = await service.findAllPaginated(2, 10, 'paris');

      expect(zoneModel.find).toHaveBeenCalledWith({
        $or: [
          { nom: { $regex: 'paris', $options: 'i' } },
          { ville: { $regex: 'paris', $options: 'i' } },
        ],
      });
      expect(skip).toHaveBeenCalledWith(10);
      expect(limit).toHaveBeenCalledWith(10);
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(zoneModel.countDocuments).toHaveBeenCalledWith({
        $or: [
          { nom: { $regex: 'paris', $options: 'i' } },
          { ville: { $regex: 'paris', $options: 'i' } },
        ],
      });
      expect(result).toEqual({
        zones: [toExpectedDto(zoneA), toExpectedDto(zoneB)],
        total: 22,
        page: 2,
        totalPages: 3,
      });
    });

    it('should use an empty query without search', async () => {
      const zone = makeZone();
      const exec = jest.fn().mockResolvedValue([zone]);
      const sort = jest.fn().mockReturnValue({ exec });
      const limit = jest.fn().mockReturnValue({ sort });
      const skip = jest.fn().mockReturnValue({ limit });

      zoneModel.find.mockReturnValue({ skip });
      zoneModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAllPaginated(1, 20);

      expect(zoneModel.find).toHaveBeenCalledWith({});
      expect(zoneModel.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({
        zones: [toExpectedDto(zone)],
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('search', () => {
    it('should search active zones by name and city', async () => {
      const zone = makeZone();
      const exec = jest.fn().mockResolvedValue([zone]);
      zoneModel.find.mockReturnValue({ exec });

      const result = await service.search('Belle', 'Paris');

      expect(zoneModel.find).toHaveBeenCalledWith({
        statut: ZoneStatus.ACTIVE,
        nom: { $regex: 'Belle', $options: 'i' },
        ville: { $regex: 'Paris', $options: 'i' },
      });
      expect(result).toEqual([toExpectedDto(zone)]);
    });

    it('should only filter by active status when filters are empty', async () => {
      const exec = jest.fn().mockResolvedValue([]);
      zoneModel.find.mockReturnValue({ exec });

      await service.search('', '');

      expect(zoneModel.find).toHaveBeenCalledWith({
        statut: ZoneStatus.ACTIVE,
      });
    });
  });

  describe('create', () => {
    it('should throw BadRequestException when polygon is missing', async () => {
      await expect(
        service.create(
          {
            nom: 'Belleville',
            ville: 'Paris',
          } as never,
          'auth0|admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when admin is missing', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            nom: 'Belleville',
            ville: 'Paris',
            polygone: {
              type: 'Polygon',
              coordinates: [
                [
                  [2.38, 48.86],
                  [2.39, 48.86],
                  [2.39, 48.87],
                  [2.38, 48.86],
                ],
              ],
            },
          },
          'auth0|admin',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(userModel.findOne).toHaveBeenCalledWith({
        auth0Id: 'auth0|admin',
      });
    });

    it('should create a zone and return dto', async () => {
      const adminId = new Types.ObjectId('507f191e810c19729de860ad');
      userModel.findOne.mockResolvedValue({ _id: adminId });

      const dto = {
        nom: 'Belleville',
        ville: 'Paris',
        polygone: {
          type: 'Polygon',
          coordinates: [
            [
              [2.38, 48.86],
              [2.39, 48.86],
              [2.39, 48.87],
              [2.38, 48.86],
            ],
          ],
        },
      };

      const savedZone = makeZone({ createdPar: adminId, ...dto });
      const save = jest.fn().mockResolvedValue(savedZone);
      zoneModel.mockImplementation((data: Record<string, unknown>) => ({
        ...data,
        save,
      }));

      const result = await service.create(dto, 'auth0|admin');

      expect(zoneModel).toHaveBeenCalledWith({
        ...dto,
        createdPar: adminId,
      });
      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(toExpectedDto(savedZone));
    });
  });

  describe('findById', () => {
    it('should return dto when zone exists', async () => {
      const zone = makeZone();
      const exec = jest.fn().mockResolvedValue(zone);
      zoneModel.findById.mockReturnValue({ exec });

      const result = await service.findById(zoneId);

      expect(zoneModel.findById).toHaveBeenCalledWith(zoneId);
      expect(result).toEqual(toExpectedDto(zone));
    });

    it('should throw NotFoundException when zone does not exist', async () => {
      const exec = jest.fn().mockResolvedValue(null);
      zoneModel.findById.mockReturnValue({ exec });

      await expect(service.findById(zoneId)).rejects.toThrow(NotFoundException);
      await expect(service.findById(zoneId)).rejects.toThrow(
        'Zone introuvable',
      );
    });
  });

  describe('update', () => {
    it('should update and return dto', async () => {
      const updatedZone = makeZone({ nom: 'Charonne' });
      const exec = jest.fn().mockResolvedValue(updatedZone);
      zoneModel.findByIdAndUpdate.mockReturnValue({ exec });

      const result = await service.update(zoneId, { nom: 'Charonne' });

      expect(zoneModel.findByIdAndUpdate).toHaveBeenCalledWith(
        zoneId,
        { nom: 'Charonne' },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(toExpectedDto(updatedZone));
    });

    it('should throw NotFoundException when zone to update is missing', async () => {
      const exec = jest.fn().mockResolvedValue(null);
      zoneModel.findByIdAndUpdate.mockReturnValue({ exec });

      await expect(service.update(zoneId, { nom: 'Charonne' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activate and desactivate', () => {
    it('should activate a zone', async () => {
      const updatedZone = makeZone({ statut: ZoneStatus.ACTIVE });
      const exec = jest.fn().mockResolvedValue(updatedZone);
      zoneModel.findByIdAndUpdate.mockReturnValue({ exec });

      const result = await service.activate(zoneId);

      expect(zoneModel.findByIdAndUpdate).toHaveBeenCalledWith(
        zoneId,
        { statut: ZoneStatus.ACTIVE },
        { new: true },
      );
      expect(result).toEqual(toExpectedDto(updatedZone));
    });

    it('should desactivate a zone', async () => {
      const updatedZone = makeZone({ statut: ZoneStatus.INACTIVE });
      const exec = jest.fn().mockResolvedValue(updatedZone);
      zoneModel.findByIdAndUpdate.mockReturnValue({ exec });

      const result = await service.desactivate(zoneId);

      expect(zoneModel.findByIdAndUpdate).toHaveBeenCalledWith(
        zoneId,
        { statut: ZoneStatus.INACTIVE },
        { new: true },
      );
      expect(result).toEqual(toExpectedDto(updatedZone));
    });

    it('should throw NotFoundException when activating an unknown zone', async () => {
      const exec = jest.fn().mockResolvedValue(null);
      zoneModel.findByIdAndUpdate.mockReturnValue({ exec });

      await expect(service.activate(zoneId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMembers', () => {
    it('should return active members of the zone', async () => {
      zoneModel.findById.mockReturnValue({
        orFail: jest.fn().mockResolvedValue(makeZone()),
      });
      const members = [{ _id: 'u1' }, { _id: 'u2' }];
      userModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(members),
      });

      const result = await service.findMembers(zoneId);

      const query = userModel.find.mock.calls[0][0] as {
        zoneId: Types.ObjectId;
        zoneStatut: ZoneMembershipStatus;
      };
      expect(query.zoneStatut).toBe(ZoneMembershipStatus.ACTIVE);
      expect(query.zoneId.toString()).toBe(zoneId);
      expect(result).toEqual(members);
    });
  });

  describe('getMyZone', () => {
    it('should return null when user does not exist', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getMyZone('auth0|missing');

      expect(result).toBeNull();
    });

    it('should return null when user has no zone', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'u1' }),
      });

      const result = await service.getMyZone('auth0|user');

      expect(result).toBeNull();
    });

    it('should return zone dto when user has a zone', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ _id: 'u1', zoneId: new Types.ObjectId(zoneId) }),
      });
      const zone = makeZone();
      zoneModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(zone),
      });

      const result = await service.getMyZone('auth0|user');

      expect(result).toEqual(toExpectedDto(zone));
    });
  });

  describe('findNearby', () => {
    it('should return active zones intersecting with the point', async () => {
      const zone = makeZone();
      zoneModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([zone]),
      });

      const result = await service.findNearby(48.86, 2.35);

      expect(zoneModel.find).toHaveBeenCalledWith({
        statut: ZoneStatus.ACTIVE,
        polygone: {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: [2.35, 48.86],
            },
          },
        },
      });
      expect(result).toEqual([toExpectedDto(zone)]);
    });
  });

  describe('getStats', () => {
    it('should aggregate zone statistics', async () => {
      const zoneDto = toExpectedDto(makeZone());
      jest.spyOn(service, 'findById').mockResolvedValue(zoneDto);

      userModel.countDocuments.mockResolvedValue(18);
      incidentModel.countDocuments
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(3);
      eventModel.countDocuments.mockResolvedValue(5);
      serviceModel.countDocuments.mockResolvedValue(9);

      const result = await service.getStats(zoneId);

      const membersQuery = userModel.countDocuments.mock.calls[0][0] as {
        zoneId: Types.ObjectId;
        zoneStatut: ZoneMembershipStatus;
      };
      expect(membersQuery.zoneId.toString()).toBe(zoneId);
      expect(membersQuery.zoneStatut).toBe(ZoneMembershipStatus.ACTIVE);

      const incidentsQuery = incidentModel.countDocuments.mock.calls[0][0] as {
        zoneId: Types.ObjectId;
      };
      expect(incidentsQuery.zoneId.toString()).toBe(zoneId);

      const activeIncidentsQuery = incidentModel.countDocuments.mock
        .calls[1][0] as {
        zoneId: Types.ObjectId;
        statut: { $in: string[] };
      };
      expect(activeIncidentsQuery.zoneId.toString()).toBe(zoneId);
      expect(activeIncidentsQuery.statut).toEqual({
        $in: ['signale', 'en_cours'],
      });

      expect(result).toEqual({
        zone: zoneDto,
        membersCount: 18,
        incidentsCount: 7,
        activeIncidentsCount: 3,
        eventsCount: 5,
        servicesCount: 9,
      });
    });
  });

  describe('findIncidentsByZone / findEventsByZone / findServicesByZone', () => {
    it('should return incidents linked to a zone', async () => {
      zoneModel.findById.mockReturnValue({
        orFail: jest.fn().mockResolvedValue(makeZone()),
      });
      const incidents = [{ _id: 'inc-1' }];
      incidentModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(incidents),
      });

      const result = await service.findIncidentsByZone(zoneId);

      const query = incidentModel.find.mock.calls[0][0] as {
        zoneId: Types.ObjectId;
      };
      expect(query.zoneId.toString()).toBe(zoneId);
      expect(result).toEqual(incidents);
    });

    it('should return events linked to a zone', async () => {
      zoneModel.findById.mockReturnValue({
        orFail: jest.fn().mockResolvedValue(makeZone()),
      });
      const events = [{ _id: 'evt-1' }];
      eventModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(events),
      });

      const result = await service.findEventsByZone(zoneId);

      const query = eventModel.find.mock.calls[0][0] as {
        zoneId: Types.ObjectId;
      };
      expect(query.zoneId.toString()).toBe(zoneId);
      expect(result).toEqual(events);
    });

    it('should return services linked to a zone', async () => {
      zoneModel.findById.mockReturnValue({
        orFail: jest.fn().mockResolvedValue(makeZone()),
      });
      const services = [{ _id: 'srv-1' }];
      serviceModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(services),
      });

      const result = await service.findServicesByZone(zoneId);

      const query = serviceModel.find.mock.calls[0][0] as {
        zoneId: Types.ObjectId;
      };
      expect(query.zoneId.toString()).toBe(zoneId);
      expect(result).toEqual(services);
    });
  });
});
