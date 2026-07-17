import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { IncidentsService } from './incidents.service';
import { Incident } from '../schemas/incident.schema';
import { User } from '../../users/schemas/user.schema';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';
import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let incidentModel: jest.Mock & {
    find: jest.Mock;
    findByIdAndUpdate: jest.Mock;
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
    const modelConstructor = jest.fn();
    incidentModel = modelConstructor as any;
    incidentModel.find = jest.fn();
    incidentModel.findByIdAndUpdate = jest.fn();

    const userModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: getModelToken(Incident.name),
          useValue: incidentModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
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
      incidentModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec,
      });

      const result = await service.findAll();

      expect(incidentModel.find).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(incidents);
    });

    it('should propagate errors from the model', async () => {
      const exec = jest.fn().mockRejectedValue(new Error('Mongo query failed'));
      incidentModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec,
      });

      await expect(service.findAll()).rejects.toThrow('Mongo query failed');
    });

    it('should apply zoneId and signaledPar filters if provided', async () => {
      const exec = jest.fn().mockResolvedValue([]);
      incidentModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec,
      });

      const zoneId = '507f191e810c19729de860bb';
      const signaledPar = 'auth0|reporter';

      await service.findAll(zoneId, signaledPar);

      expect(incidentModel.find).toHaveBeenCalledWith({
        zoneId: new Types.ObjectId(zoneId),
        signaledPar,
      });
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

      expect(incidentModel).toHaveBeenCalledWith({
        ...dto,
        zoneId: new Types.ObjectId(dto.zoneId),
      });
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

    it('should create and convert assignedTo to ObjectId if provided', async () => {
      const assignedToId = '507f191e810c19729de860cc';
      const dto: CreateIncidentDto = {
        type: 'voirie',
        description: 'Nid de poule sur la chaussée',
        assignedTo: assignedToId,
      };

      const save = jest.fn().mockResolvedValue(dto);
      incidentModel.mockImplementation((data: any) => ({
        ...data,
        save,
      }));

      await service.create(dto);

      expect(incidentModel).toHaveBeenCalledWith({
        ...dto,
        assignedTo: new Types.ObjectId(assignedToId),
      });
    });
  });

  describe('updateStatut', () => {
    it('should update incident status and resolution comment', async () => {
      const incidentId = '507f191e810c19729de860aa';
      const updatedIncident = makeIncident({
        statut: IncidentStatus.RESOLVED,
        resolutionComment: 'Fixed the issue',
      });

      const exec = jest.fn().mockResolvedValue(updatedIncident);
      const lean = jest.fn().mockReturnValue({ exec });
      incidentModel.findByIdAndUpdate.mockReturnValue({ lean });

      const result = await service.updateStatut(incidentId, {
        statut: IncidentStatus.RESOLVED,
        resolutionComment: 'Fixed the issue',
      });

      expect(incidentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        incidentId,
        {
          statut: IncidentStatus.RESOLVED,
          resolutionComment: 'Fixed the issue',
        },
        { returnDocument: 'after' },
      );
      expect(result).toEqual(updatedIncident);
    });

    it('should handle assignedTo update correctly (convert to ObjectId or set null)', async () => {
      const incidentId = '507f191e810c19729de860aa';
      const assignedToId = '507f191e810c19729de860cc';

      const exec = jest.fn().mockResolvedValue({});
      const lean = jest.fn().mockReturnValue({ exec });
      incidentModel.findByIdAndUpdate.mockReturnValue({ lean });

      await service.updateStatut(incidentId, {
        statut: IncidentStatus.IN_PROGRESS,
        assignedTo: assignedToId,
      });

      expect(incidentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        incidentId,
        {
          statut: IncidentStatus.IN_PROGRESS,
          assignedTo: new Types.ObjectId(assignedToId),
        },
        { returnDocument: 'after' },
      );

      await service.updateStatut(incidentId, {
        statut: IncidentStatus.IN_PROGRESS,
        assignedTo: '',
      });

      expect(incidentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        incidentId,
        {
          statut: IncidentStatus.IN_PROGRESS,
          assignedTo: null,
        },
        { returnDocument: 'after' },
      );
    });

    it('should throw NotFoundException if incident is not found', async () => {
      const incidentId = '507f191e810c19729de860aa';
      const exec = jest.fn().mockResolvedValue(null);
      const lean = jest.fn().mockReturnValue({ exec });
      incidentModel.findByIdAndUpdate.mockReturnValue({ lean });

      await expect(
        service.updateStatut(incidentId, { statut: IncidentStatus.RESOLVED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
