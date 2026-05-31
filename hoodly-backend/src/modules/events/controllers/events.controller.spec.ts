import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from '../services/events.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { NotFoundException } from '@nestjs/common';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { VerifiedGuard } from '../../../core/auth/guards/verified.guard';

describe('EventsController', () => {
  let controller: EventsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const mockJwtGuard = { canActivate: jest.fn(() => true) };
  const mockVerifiedGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(VerifiedGuard)
      .useValue(mockVerifiedGuard)
      .compile();

    controller = module.get<EventsController>(EventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return the result', async () => {
      const dto: CreateEventDto = {
        titre: 'Clean Walk',
        categorie: 'Ecologie',
        date: new Date('2026-01-01T10:00:00.000Z'),
        lieu: { adresse: 'Paris' },
        capacite: 30,
      };
      const expectedResult = { id: '1', ...dto };
      service.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with parsed parameters', async () => {
      const expectedResult = {
        events: [],
        total: 0,
        page: 2,
        limit: 5,
        totalPages: 0,
      };
      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(
        '2',
        '5',
        'clean',
        'Ecologie',
        'planifié',
      );

      expect(service.findAll).toHaveBeenCalledWith(
        2,
        5,
        'clean',
        'Ecologie',
        'planifié',
      );
      expect(result).toEqual(expectedResult);
    });

    it('should call service.findAll with default parameters when query is empty', async () => {
      const expectedResult = {
        events: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(service.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return the event if found', async () => {
      const eventId = '507f191e810c19729de860dd';
      const expectedResult = { id: eventId, titre: 'Clean Walk' };
      service.findById.mockResolvedValue(expectedResult);

      const result = await controller.findOne(eventId);

      expect(service.findById).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException if event is not found', async () => {
      const eventId = '507f191e810c19729de860dd';
      service.findById.mockResolvedValue(null);

      await expect(controller.findOne(eventId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated event', async () => {
      const eventId = '507f191e810c19729de860dd';
      const dto: UpdateEventDto = { titre: 'Updated Titre' };
      const expectedResult = { id: eventId, titre: 'Updated Titre' };
      service.update.mockResolvedValue(expectedResult);

      const result = await controller.update(eventId, dto);

      expect(service.update).toHaveBeenCalledWith(eventId, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call service.delete and return success', async () => {
      const eventId = '507f191e810c19729de860dd';
      const expectedResult = { message: 'Événement supprimé' };
      service.delete.mockResolvedValue(expectedResult);

      const result = await controller.remove(eventId);

      expect(service.delete).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedResult);
    });
  });
});
