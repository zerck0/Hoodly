import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { IncidentsService } from './incidents.service';
import { Incident } from '../schemas/incident.schema';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let incidentModel: jest.Mock & { find: jest.Mock };

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
    const modelConstructor = jest.fn();
    incidentModel = modelConstructor as jest.Mock & { find: jest.Mock };
    incidentModel.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: getModelToken(Incident.name),
          useValue: incidentModel,
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all incidents from the model', async () => {
      const incidents = [
        makeIncident(),
        makeIncident({
          _id: '507f191e810c19729de860ab',
          type: 'eclairage',
          description: 'Lampe de rue cassée',
        }),
      ];
      const exec = jest.fn().mockResolvedValue(incidents);
      incidentModel.find.mockReturnValue({ exec });

      const result = await service.findAll();

      expect(incidentModel.find).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(incidents);
    });

    it('should propagate errors from the model', async () => {
      const exec = jest.fn().mockRejectedValue(new Error('Mongo query failed'));
      incidentModel.find.mockReturnValue({ exec });

      await expect(service.findAll()).rejects.toThrow('Mongo query failed');
    });
  });

  describe('create', () => {
    it('should create and save an incident', async () => {
      const dto: CreateIncidentDto = {
        type: 'voirie',
        description: 'Nid de poule sur la chaussée',
        photoUrl: 'https://cdn.hoodly.fr/incidents/photo.png',
        statut: IncidentStatus.REPORTED,
        priorite: IncidentPriority.NORMAL,
        signaledPar: 'auth0|reporter',
        zoneId: '507f191e810c19729de860bb',
      };

      const savedIncident = makeIncident(
        dto as unknown as Record<string, unknown>,
      );
      const save = jest.fn().mockResolvedValue(savedIncident);
      incidentModel.mockImplementation((data: CreateIncidentDto) => ({
        ...data,
        save,
      }));

      const result = await service.create(dto);

      expect(incidentModel).toHaveBeenCalledWith(dto);
      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(savedIncident);
    });

    it('should propagate save errors', async () => {
      const dto: CreateIncidentDto = {
        type: 'voirie',
        description: 'Nid de poule sur la chaussée',
      };

      const save = jest.fn().mockRejectedValue(new Error('Mongo save failed'));
      incidentModel.mockImplementation((data: CreateIncidentDto) => ({
        ...data,
        save,
      }));

      await expect(service.create(dto)).rejects.toThrow('Mongo save failed');
    });
  });
});
