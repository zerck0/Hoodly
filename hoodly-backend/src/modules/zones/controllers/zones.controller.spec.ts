import { Test, TestingModule } from '@nestjs/testing';
import { ZonesController } from './zones.controller';
import { ZonesService } from '../services/zones.service';
import { ZoneRequestsService } from '../services/zone-requests.service';
import { ZoneMembershipsService } from '../services/zone-memberships.service';

describe('ZonesController', () => {
  let controller: ZonesController;
  let zonesService: {
    findAllPaginated: jest.Mock;
    search: jest.Mock;
    getMyZone: jest.Mock;
    findNearby: jest.Mock;
    findById: jest.Mock;
    findMembers: jest.Mock;
    getStats: jest.Mock;
    findIncidentsByZone: jest.Mock;
    findEventsByZone: jest.Mock;
    findServicesByZone: jest.Mock;
    create: jest.Mock;
    activate: jest.Mock;
    update: jest.Mock;
    desactivate: jest.Mock;
  };
  let zoneRequestsService: {
    findAll: jest.Mock;
    create: jest.Mock;
    accept: jest.Mock;
    refuse: jest.Mock;
  };
  let zoneMembershipsService: {
    findAll: jest.Mock;
    create: jest.Mock;
    accept: jest.Mock;
    refuse: jest.Mock;
  };

  const user = { sub: 'auth0|user-1' };

  beforeEach(async () => {
    zonesService = {
      findAllPaginated: jest.fn(),
      search: jest.fn(),
      getMyZone: jest.fn(),
      findNearby: jest.fn(),
      findById: jest.fn(),
      findMembers: jest.fn(),
      getStats: jest.fn(),
      findIncidentsByZone: jest.fn(),
      findEventsByZone: jest.fn(),
      findServicesByZone: jest.fn(),
      create: jest.fn(),
      activate: jest.fn(),
      update: jest.fn(),
      desactivate: jest.fn(),
    };

    zoneRequestsService = {
      findAll: jest.fn(),
      create: jest.fn(),
      accept: jest.fn(),
      refuse: jest.fn(),
    };

    zoneMembershipsService = {
      findAll: jest.fn(),
      create: jest.fn(),
      accept: jest.fn(),
      refuse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZonesController],
      providers: [
        {
          provide: ZonesService,
          useValue: zonesService,
        },
        {
          provide: ZoneRequestsService,
          useValue: zoneRequestsService,
        },
        {
          provide: ZoneMembershipsService,
          useValue: zoneMembershipsService,
        },
      ],
    }).compile();

    controller = module.get<ZonesController>(ZonesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should parse page/limit and delegate to service', async () => {
      const payload = {
        zones: [],
        total: 0,
        page: 2,
        totalPages: 0,
      };
      zonesService.findAllPaginated.mockResolvedValue(payload);

      const result = await controller.findAll('2', '15', 'paris');

      expect(zonesService.findAllPaginated).toHaveBeenCalledWith(2, 15, 'paris');
      expect(result).toEqual(payload);
    });

    it('should use defaults when page and limit are missing', async () => {
      zonesService.findAllPaginated.mockResolvedValue({
        zones: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      await controller.findAll(undefined, undefined, undefined);

      expect(zonesService.findAllPaginated).toHaveBeenCalledWith(1, 20, undefined);
    });
  });

  describe('search', () => {
    it('should delegate to zonesService.search', async () => {
      zonesService.search.mockResolvedValue([]);

      await controller.search('Belleville', 'Paris');

      expect(zonesService.search).toHaveBeenCalledWith('Belleville', 'Paris');
    });
  });

  describe('getMyZone', () => {
    it('should use current user sub', async () => {
      zonesService.getMyZone.mockResolvedValue(null);

      await controller.getMyZone(user);

      expect(zonesService.getMyZone).toHaveBeenCalledWith(user.sub);
    });
  });

  describe('findNearby', () => {
    it('should parse lat/lng and delegate', async () => {
      zonesService.findNearby.mockResolvedValue([]);

      await controller.findNearby('48.861', '2.351');

      expect(zonesService.findNearby).toHaveBeenCalledWith(48.861, 2.351);
    });
  });

  describe('zone requests', () => {
    it('should list zone requests', async () => {
      zoneRequestsService.findAll.mockResolvedValue([]);

      await controller.findAllZoneRequests();

      expect(zoneRequestsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should create a zone request from body and user', async () => {
      const body = {
        nomQuartier: 'Belleville',
        ville: 'Paris',
        codePostal: '75020',
        description: 'Nouveau quartier',
      };
      zoneRequestsService.create.mockResolvedValue({ id: 'request-1' });

      await controller.createZoneRequest(body, user);

      expect(zoneRequestsService.create).toHaveBeenCalledWith(body, user.sub);
    });

    it('should accept a zone request with optional comment', async () => {
      zoneRequestsService.accept.mockResolvedValue({ id: 'zone-1' });

      await controller.acceptZoneRequest('507f191e810c19729de860aa', user, {
        commentaire: 'ok',
      });

      expect(zoneRequestsService.accept).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
        user.sub,
        'ok',
      );
    });

    it('should accept a zone request with undefined comment when missing', async () => {
      zoneRequestsService.accept.mockResolvedValue({ id: 'zone-1' });

      await controller.acceptZoneRequest('507f191e810c19729de860aa', user, {});

      expect(zoneRequestsService.accept).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
        user.sub,
        undefined,
      );
    });

    it('should refuse a zone request with fallback empty comment', async () => {
      zoneRequestsService.refuse.mockResolvedValue({ id: 'request-1' });

      await controller.refuseZoneRequest('507f191e810c19729de860aa', user, {});

      expect(zoneRequestsService.refuse).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
        user.sub,
        '',
      );
    });
  });

  describe('memberships', () => {
    it('should list membership requests', async () => {
      zoneMembershipsService.findAll.mockResolvedValue([]);

      await controller.findAllMemberships();

      expect(zoneMembershipsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should create membership request mapping body fields', async () => {
      const body = {
        zoneId: '507f191e810c19729de860aa',
        justificatifUrl: 'https://cdn.hoodly.fr/justif.pdf',
        pieceIdentiteUrl: 'https://cdn.hoodly.fr/id.pdf',
      };
      zoneMembershipsService.create.mockResolvedValue({ id: 'membership-1' });

      await controller.createMembership(body, user);

      expect(zoneMembershipsService.create).toHaveBeenCalledWith(
        body.zoneId,
        user.sub,
        body.justificatifUrl,
        body.pieceIdentiteUrl,
      );
    });

    it('should accept membership using id and user', async () => {
      zoneMembershipsService.accept.mockResolvedValue({ id: 'membership-1' });

      await controller.acceptMembership('507f191e810c19729de860aa', user);

      expect(zoneMembershipsService.accept).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
        user.sub,
      );
    });

    it('should refuse membership with fallback empty comment', async () => {
      zoneMembershipsService.refuse.mockResolvedValue({ id: 'membership-1' });

      await controller.refuseMembership('507f191e810c19729de860aa', user, {});

      expect(zoneMembershipsService.refuse).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
        user.sub,
        '',
      );
    });
  });

  describe('zone resources', () => {
    it('should delegate findOne', async () => {
      zonesService.findById.mockResolvedValue({ id: 'zone-1' });

      await controller.findOne('507f191e810c19729de860aa');

      expect(zonesService.findById).toHaveBeenCalledWith('507f191e810c19729de860aa');
    });

    it('should delegate findMembers', async () => {
      zonesService.findMembers.mockResolvedValue([]);

      await controller.findMembers('507f191e810c19729de860aa');

      expect(zonesService.findMembers).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
      );
    });

    it('should delegate getStats', async () => {
      zonesService.getStats.mockResolvedValue({});

      await controller.getStats('507f191e810c19729de860aa');

      expect(zonesService.getStats).toHaveBeenCalledWith('507f191e810c19729de860aa');
    });

    it('should delegate findIncidentsByZone', async () => {
      zonesService.findIncidentsByZone.mockResolvedValue([]);

      await controller.findIncidentsByZone('507f191e810c19729de860aa');

      expect(zonesService.findIncidentsByZone).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
      );
    });

    it('should delegate findEventsByZone', async () => {
      zonesService.findEventsByZone.mockResolvedValue([]);

      await controller.findEventsByZone('507f191e810c19729de860aa');

      expect(zonesService.findEventsByZone).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
      );
    });

    it('should delegate findServicesByZone', async () => {
      zonesService.findServicesByZone.mockResolvedValue([]);

      await controller.findServicesByZone('507f191e810c19729de860aa');

      expect(zonesService.findServicesByZone).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
      );
    });
  });

  describe('admin zone actions', () => {
    it('should create a zone from body and current user', async () => {
      const body = {
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
      zonesService.create.mockResolvedValue({ id: 'zone-1' });

      await controller.create(body, user);

      expect(zonesService.create).toHaveBeenCalledWith(body, user.sub);
    });

    it('should activate a zone', async () => {
      zonesService.activate.mockResolvedValue({ id: 'zone-1' });

      await controller.activate('507f191e810c19729de860aa');

      expect(zonesService.activate).toHaveBeenCalledWith('507f191e810c19729de860aa');
    });

    it('should update a zone', async () => {
      const body = { nom: 'Charonne' };
      zonesService.update.mockResolvedValue({ id: 'zone-1' });

      await controller.update('507f191e810c19729de860aa', body);

      expect(zonesService.update).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
        body,
      );
    });

    it('should desactivate a zone', async () => {
      zonesService.desactivate.mockResolvedValue({ id: 'zone-1' });

      await controller.desactivate('507f191e810c19729de860aa');

      expect(zonesService.desactivate).toHaveBeenCalledWith(
        '507f191e810c19729de860aa',
      );
    });
  });
});
