import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getModelToken } from '@nestjs/mongoose';
import { Event, EventStatus } from '../schemas/event.schema';
import { User } from '../../users/schemas/user.schema';
import { ConversationsService } from '../../conversations/services/conversations.service';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { Neo4jService } from '../../neo4j/neo4j.service';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let eventModel: jest.Mock & {
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    countDocuments: jest.Mock;
  };
  let userModel: any;
  let conversationsService: any;
  let transactionsService: any;
  let neo4jService: any;

  const makeEvent = (overrides: Record<string, unknown> = {}) => {
    const now = new Date('2026-01-01T10:00:00.000Z');

    return {
      _id: '507f191e810c19729de860dd',
      titre: 'Clean Walk',
      categorie: 'Ecologie',
      date: now,
      lieu: {
        adresse: '12 rue de la Paix',
        ville: 'Paris',
        codePostal: '75001',
      },
      capacite: 30,
      statut: EventStatus.PLANNED,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  };

  const toExpectedDto = (event: ReturnType<typeof makeEvent>) => ({
    id: event._id.toString(),
    titre: event.titre,
    categorie: event.categorie,
    date: event.date,
    lieu: event.lieu,
    capacite: event.capacite,
    statut: event.statut,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  });

  beforeEach(async () => {
    const modelConstructor = jest.fn();
    eventModel = modelConstructor as any;
    eventModel.find = jest.fn();
    eventModel.findById = jest.fn();
    eventModel.findByIdAndUpdate = jest.fn();
    eventModel.findByIdAndDelete = jest.fn();
    eventModel.countDocuments = jest.fn();

    userModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    conversationsService = {
      createForEvent: jest.fn(),
      addParticipantToEvent: jest.fn(),
      removeParticipantFromEvent: jest.fn(),
      sendSystemMessage: jest.fn(),
      deleteByEventId: jest.fn(),
    };

    transactionsService = {
      create: jest.fn(),
      awardPoints: jest.fn(),
      transferPoints: jest.fn(),
    };

    neo4jService = {
      syncInteret: jest.fn(),
      removeInteret: jest.fn(),
      syncParticipation: jest.fn(),
      removeParticipation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: eventModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: ConversationsService,
          useValue: conversationsService,
        },
        {
          provide: TransactionsService,
          useValue: transactionsService,
        },
        {
          provide: Neo4jService,
          useValue: neo4jService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an event successfully', async () => {
      const eventData = {
        titre: 'Clean Walk',
        categorie: 'Ecologie',
        date: new Date('2026-01-01T10:00:00.000Z'),
        lieu: {},
        capacite: 30,
      };
      const savedEvent = makeEvent(eventData);
      const save = jest.fn().mockResolvedValue(savedEvent);
      eventModel.mockImplementation(() => ({
        ...savedEvent,
        save,
      }));

      const result = await service.create(eventData, 'user-123');

      expect(eventModel).toHaveBeenCalledWith({ ...eventData, createurId: expect.any(Object) });
      expect(save).toHaveBeenCalled();
      expect(result).toEqual(toExpectedDto(savedEvent));
    });

    it('should throw InternalServerErrorException if creation fails', async () => {
      const eventData = {
        titre: 'Clean Walk',
        categorie: 'Ecologie',
        date: new Date(),
        lieu: {},
        capacite: 30,
      };
      const save = jest.fn().mockRejectedValue(new Error('Save failed'));
      eventModel.mockImplementation(() => ({
        save,
      }));

      await expect(service.create(eventData, 'user-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated events with search filters', async () => {
      const e1 = makeEvent({ titre: 'Clean Walk' });
      const e2 = makeEvent({
        _id: '507f191e810c19729de860de',
        titre: 'Voisinage',
        categorie: 'Social',
      });

      const lean = jest.fn().mockResolvedValue([e1, e2]);
      const sort = jest.fn().mockReturnValue({ lean });
      const limit = jest.fn().mockReturnValue({ sort });
      const skip = jest.fn().mockReturnValue({ limit });

      eventModel.find.mockReturnValue({ skip });
      eventModel.countDocuments.mockResolvedValue(2);

      const result = await service.findAll(
        2,
        5,
        'clean',
        'Ecologie',
        EventStatus.PLANNED,
      );

      expect(eventModel.find).toHaveBeenCalledWith({
        $or: [
          { titre: { $regex: 'clean', $options: 'i' } },
          { categorie: { $regex: 'clean', $options: 'i' } },
        ],
        categorie: 'Ecologie',
        statut: EventStatus.PLANNED,
      });
      expect(skip).toHaveBeenCalledWith(5);
      expect(limit).toHaveBeenCalledWith(5);
      expect(sort).toHaveBeenCalledWith({ date: -1 });
      expect(result).toEqual({
        events: [toExpectedDto(e1), toExpectedDto(e2)],
        total: 2,
        page: 2,
        limit: 5,
        totalPages: 1,
      });
    });

    it('should work with empty query when no filters are passed', async () => {
      const e = makeEvent();
      const lean = jest.fn().mockResolvedValue([e]);
      const sort = jest.fn().mockReturnValue({ lean });
      const limit = jest.fn().mockReturnValue({ sort });
      const skip = jest.fn().mockReturnValue({ limit });

      eventModel.find.mockReturnValue({ skip });
      eventModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll();

      expect(eventModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual({
        events: [toExpectedDto(e)],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should return event DTO if found', async () => {
      const e = makeEvent();
      eventModel.findById.mockResolvedValue(e);

      const result = await service.findById(e._id);

      expect(eventModel.findById).toHaveBeenCalledWith(e._id);
      expect(result).toEqual(toExpectedDto(e));
    });

    it('should return null if not found', async () => {
      eventModel.findById.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update event and return updated DTO', async () => {
      const e = makeEvent({ titre: 'Updated Titre' });
      eventModel.findByIdAndUpdate.mockResolvedValue(e);

      const result = await service.update(e._id, { titre: 'Updated Titre' });

      expect(eventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        e._id,
        { $set: { titre: 'Updated Titre' } },
        { returnDocument: 'after' },
      );
      expect(result).toEqual(toExpectedDto(e));
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('missing', { titre: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete event successfully', async () => {
      const e = makeEvent();
      eventModel.findById.mockResolvedValue(e);
      eventModel.findByIdAndDelete.mockResolvedValue(e);

      const result = await service.delete(e._id);

      expect(eventModel.findById).toHaveBeenCalledWith(e._id);
      expect(eventModel.findByIdAndDelete).toHaveBeenCalledWith(e._id);
      expect(result).toEqual({ message: 'Événement annulé et participants remboursés' });
    });

    it('should throw NotFoundException if event to delete does not exist', async () => {
      eventModel.findById.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
