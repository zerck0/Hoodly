import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from '../services/incidents.service';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';

describe('IncidentsController', () => {
  let controller: IncidentsController;
  let incidentsService: {
    findAll: jest.Mock;
    create: jest.Mock;
  };

  const makeIncident = (overrides: Record<string, unknown> = {}) => {
    const now = new Date('2026-01-01T10:00:00.000Z');

    return {
      _id: '507f191e810c19729de860aa',
      type: 'voirie',
      description: 'Nid de poule sur la chaussée',
      photoUrl: 'https://cdn.hoodly.fr/incidents/photo.png',
      statut: IncidentStatus.REPORTED,
      priorite: IncidentPriority.NORMAL,
      signaledPar: 'auth0|reporter',
      zoneId: '507f191e810c19729de860bb',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  };

  beforeEach(async () => {
    incidentsService = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        {
          provide: IncidentsService,
          useValue: incidentsService,
        },
      ],
    }).compile();

    controller = module.get<IncidentsController>(IncidentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return incidents from service', async () => {
      const incidents = [
        makeIncident(),
        makeIncident({
          _id: '507f191e810c19729de860ab',
          type: 'eclairage',
          description: 'Lampe de rue cassée',
        }),
      ];
      incidentsService.findAll.mockResolvedValue(incidents);

      const result = await controller.findAll();

      expect(incidentsService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(incidents);
    });
  });

  describe('create', () => {
    it('should delegate creation to service with request body', async () => {
      const dto = {
        type: 'voirie',
        description: 'Nid de poule sur la chaussée',
        priorite: IncidentPriority.HIGH,
      };
      const created = makeIncident({ ...dto, priorite: IncidentPriority.HIGH });
      incidentsService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(incidentsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });
});
