import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { VotesService } from './votes.service';
import { Vote, VoteStatus } from './schemas/vote.schema';
import { UsersService } from '../users/services/users.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('VotesService', () => {
  let service: VotesService;
  let usersService: UsersService;

  let mockVoteModel: any;
  let mockVoteDoc: any;

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockZoneId = new Types.ObjectId();
    const mockCreatorId = new Types.ObjectId();

    mockVoteDoc = {
      _id: new Types.ObjectId(),
      zoneId: mockZoneId,
      creatorId: mockCreatorId,
      title: 'Scrutin Test',
      description: 'Description du scrutin',
      options: ['Option A', 'Option B'],
      expirationDate: new Date(Date.now() + 3600 * 1000), // 1 hour in future
      status: VoteStatus.ACTIVE,
      votedUsers: [],
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockVoteModel = jest.fn().mockImplementation((dto) => {
      return {
        ...dto,
        _id: new Types.ObjectId(),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
    });

    mockVoteModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockVoteDoc]),
    });

    mockVoteModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockVoteDoc),
    });

    mockVoteModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotesService,
        {
          provide: getModelToken(Vote.name),
          useValue: mockVoteModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<VotesService>(VotesService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a vote successfully', async () => {
      const zoneId = mockVoteDoc.zoneId.toString();
      const creatorId = mockVoteDoc.creatorId.toString();

      const createDto = {
        zoneId,
        title: 'New Vote',
        description: 'New Description',
        options: ['Yes', 'No'],
        expirationDate: new Date(Date.now() + 3600 * 1000).toISOString(),
      };

      mockUsersService.findById.mockResolvedValueOnce({
        _id: creatorId,
        zoneId: mockVoteDoc.zoneId,
      });

      const result = await service.create(creatorId, createDto);

      expect(result).toBeDefined();
      expect(mockUsersService.findById).toHaveBeenCalledWith(creatorId);
    });

    it('should throw NotFoundException if creator is not found', async () => {
      mockUsersService.findById.mockResolvedValueOnce(null);

      await expect(
        service.create('some-creator', {
          zoneId: 'some-zone',
          title: 'Title',
          options: [],
          expirationDate: new Date().toISOString(),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if creator zone does not match', async () => {
      const creatorId = mockVoteDoc.creatorId.toString();
      mockUsersService.findById.mockResolvedValueOnce({
        _id: creatorId,
        zoneId: new Types.ObjectId(), // different zone
      });

      await expect(
        service.create(creatorId, {
          zoneId: mockVoteDoc.zoneId.toString(),
          title: 'Title',
          options: [],
          expirationDate: new Date().toISOString(),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if expiration date is in the past', async () => {
      const creatorId = mockVoteDoc.creatorId.toString();
      mockUsersService.findById.mockResolvedValueOnce({
        _id: creatorId,
        zoneId: mockVoteDoc.zoneId,
      });

      await expect(
        service.create(creatorId, {
          zoneId: mockVoteDoc.zoneId.toString(),
          title: 'Title',
          options: [],
          expirationDate: new Date(Date.now() - 1000).toISOString(), // past
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByZone', () => {
    it('should return all votes for a zone', async () => {
      const zoneId = new Types.ObjectId();
      const result = await service.findAllByZone(zoneId.toString());

      expect(result).toEqual([mockVoteDoc]);
      expect(mockVoteModel.find).toHaveBeenCalledWith({ zoneId });
    });
  });

  describe('findOne', () => {
    it('should return the vote', async () => {
      const result = await service.findOne(mockVoteDoc._id.toString());
      expect(result).toEqual(mockVoteDoc);
    });

    it('should throw NotFoundException if vote is not found', async () => {
      mockVoteModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('any-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should auto-close the vote if expired', async () => {
      mockVoteDoc.expirationDate = new Date(Date.now() - 3600 * 1000); // expired
      mockVoteDoc.status = VoteStatus.ACTIVE;

      const result = await service.findOne(mockVoteDoc._id.toString());

      expect(result.status).toBe(VoteStatus.CLOSED);
      expect(mockVoteDoc.save).toHaveBeenCalled();
    });
  });

  describe('vote', () => {
    it('should record a vote successfully', async () => {
      const userId = new Types.ObjectId();
      mockUsersService.findById.mockResolvedValueOnce({
        _id: userId,
        zoneId: mockVoteDoc.zoneId,
      });

      const result = await service.vote(
        mockVoteDoc._id.toString(),
        userId.toString(),
        'Option A',
      );

      expect(result.votedUsers).toHaveLength(1);
      expect(result.votedUsers[0].option).toBe('Option A');
      expect(mockVoteDoc.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if vote status is CLOSED', async () => {
      mockVoteDoc.status = VoteStatus.CLOSED;

      await expect(
        service.vote(mockVoteDoc._id.toString(), 'user-id', 'Option A'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should auto-close and throw BadRequestException if expired', async () => {
      mockVoteDoc.expirationDate = new Date(Date.now() - 1000); // expired
      mockVoteDoc.status = VoteStatus.ACTIVE;

      await expect(
        service.vote(mockVoteDoc._id.toString(), 'user-id', 'Option A'),
      ).rejects.toThrow(BadRequestException);

      expect(mockVoteDoc.status).toBe(VoteStatus.CLOSED);
      expect(mockVoteDoc.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValueOnce(null);

      await expect(
        service.vote(mockVoteDoc._id.toString(), 'user-id', 'Option A'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user zone does not match', async () => {
      const userId = new Types.ObjectId();
      mockUsersService.findById.mockResolvedValueOnce({
        _id: userId,
        zoneId: new Types.ObjectId(), // different zone
      });

      await expect(
        service.vote(mockVoteDoc._id.toString(), userId.toString(), 'Option A'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if user already voted', async () => {
      const userId = new Types.ObjectId();
      mockVoteDoc.votedUsers.push({ userId, option: 'Option A' });

      mockUsersService.findById.mockResolvedValueOnce({
        _id: userId,
        zoneId: mockVoteDoc.zoneId,
      });

      await expect(
        service.vote(mockVoteDoc._id.toString(), userId.toString(), 'Option B'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if option is invalid', async () => {
      const userId = new Types.ObjectId();
      mockUsersService.findById.mockResolvedValueOnce({
        _id: userId,
        zoneId: mockVoteDoc.zoneId,
      });

      await expect(
        service.vote(
          mockVoteDoc._id.toString(),
          userId.toString(),
          'Invalid Option',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a vote if user is the creator', async () => {
      const result = await service.delete(
        mockVoteDoc._id.toString(),
        mockVoteDoc.creatorId.toString(),
        'user',
      );

      expect(result.message).toBe('Vote supprimé avec succès');
      expect(mockVoteModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockVoteDoc._id.toString(),
      );
    });

    it('should delete a vote if user is admin', async () => {
      const result = await service.delete(
        mockVoteDoc._id.toString(),
        'some-admin-id',
        'admin',
      );

      expect(result.message).toBe('Vote supprimé avec succès');
    });

    it('should throw ForbiddenException if user is not creator or admin/moderator', async () => {
      await expect(
        service.delete(mockVoteDoc._id.toString(), 'other-user-id', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('close', () => {
    it('should close a vote if user is the creator', async () => {
      const result = await service.close(
        mockVoteDoc._id.toString(),
        mockVoteDoc.creatorId.toString(),
        'user',
      );

      expect(result.status).toBe(VoteStatus.CLOSED);
      expect(mockVoteDoc.save).toHaveBeenCalled();
    });

    it('should close a vote if user is moderator', async () => {
      const result = await service.close(
        mockVoteDoc._id.toString(),
        'some-mod-id',
        'moderator',
      );

      expect(result.status).toBe(VoteStatus.CLOSED);
    });

    it('should throw ForbiddenException if user is not creator or admin/moderator', async () => {
      await expect(
        service.close(mockVoteDoc._id.toString(), 'other-user-id', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
