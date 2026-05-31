import { Test, TestingModule } from '@nestjs/testing';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';

describe('VotesController', () => {
  let controller: VotesController;
  let service: VotesService;

  const mockVotesService = {
    create: jest.fn(),
    findAllByZone: jest.fn(),
    findOne: jest.fn(),
    vote: jest.fn(),
    close: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotesController],
      providers: [
        {
          provide: VotesService,
          useValue: mockVotesService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VotesController>(VotesController);
    service = module.get<VotesService>(VotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const user = { userId: 'user-id', role: 'user' };
      const dto = {
        zoneId: 'zone-id',
        title: 'Title',
        description: 'Desc',
        options: ['A', 'B'],
        expirationDate: '2026-12-31T23:59:59.000Z',
      };
      mockVotesService.create.mockResolvedValueOnce({ _id: 'vote-id' });

      const result = await controller.create(user, dto);

      expect(result).toEqual({ _id: 'vote-id' });
      expect(mockVotesService.create).toHaveBeenCalledWith('user-id', dto);
    });
  });

  describe('findAllByZone', () => {
    it('should call service.findAllByZone', async () => {
      mockVotesService.findAllByZone.mockResolvedValueOnce([]);

      const result = await controller.findAllByZone('zone-id');

      expect(result).toEqual([]);
      expect(mockVotesService.findAllByZone).toHaveBeenCalledWith('zone-id');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      mockVotesService.findOne.mockResolvedValueOnce({ _id: 'vote-id' });

      const result = await controller.findOne('vote-id');

      expect(result).toEqual({ _id: 'vote-id' });
      expect(mockVotesService.findOne).toHaveBeenCalledWith('vote-id');
    });
  });

  describe('vote', () => {
    it('should call service.vote', async () => {
      const user = { userId: 'user-id', role: 'user' };
      const dto = { option: 'Option A' };
      mockVotesService.vote.mockResolvedValueOnce({ _id: 'vote-id' });

      const result = await controller.vote('vote-id', user, dto);

      expect(result).toEqual({ _id: 'vote-id' });
      expect(mockVotesService.vote).toHaveBeenCalledWith(
        'vote-id',
        'user-id',
        'Option A',
      );
    });
  });

  describe('close', () => {
    it('should call service.close', async () => {
      const user = { userId: 'user-id', role: 'user' };
      mockVotesService.close.mockResolvedValueOnce({ _id: 'vote-id' });

      const result = await controller.close('vote-id', user);

      expect(result).toEqual({ _id: 'vote-id' });
      expect(mockVotesService.close).toHaveBeenCalledWith(
        'vote-id',
        'user-id',
        'user',
      );
    });
  });

  describe('delete', () => {
    it('should call service.delete', async () => {
      const user = { userId: 'user-id', role: 'user' };
      mockVotesService.delete.mockResolvedValueOnce({ message: 'Deleted' });

      const result = await controller.delete('vote-id', user);

      expect(result).toEqual({ message: 'Deleted' });
      expect(mockVotesService.delete).toHaveBeenCalledWith(
        'vote-id',
        'user-id',
        'user',
      );
    });
  });
});
