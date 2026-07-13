import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from '../schemas/user.schema';
import { Conversation } from '../../conversations/schemas/conversation.schema';
import { Post } from '../../posts/schemas/post.schema';
import { Incident } from '../../incidents/schemas/incident.schema';
import { Event } from '../../events/schemas/event.schema';
import { ModeratorApplication } from '../schemas/moderator-application.schema';

import { TransactionsService } from '../../transactions/services/transactions.service';
import { EmailsService } from '../../emails/emails.service';

describe('UsersService', () => {
  let service: UsersService;
  let moderatorApplicationModel: any;
  let transactionsService: {
    create: jest.Mock;
  };
  let userModel: jest.Mock & {
    findOneAndUpdate: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };
  let conversationModel: { countDocuments: jest.Mock };
  let postModel: { countDocuments: jest.Mock };
  let incidentModel: { countDocuments: jest.Mock };
  let eventModel: { countDocuments: jest.Mock };

  const makeUser = (overrides: Record<string, unknown> = {}) => {
    const now = new Date('2026-01-01T10:00:00.000Z');

    return {
      _id: '507f191e810c19729de860ea',
      auth0Id: 'auth0|abc123',
      email: 'john.doe@example.com',
      name: 'John Doe',
      picture: 'https://cdn.hoodly.fr/avatar.png',
      role: UserRole.USER,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      claimedMissions: [],
      ...overrides,
    };
  };

  const toExpectedDto = (user: ReturnType<typeof makeUser>) => ({
    id: user._id.toString(),
    auth0Id: user.auth0Id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    phone: (user as any).phone,
    zoneStatut: (user as any).zoneStatut,
    zoneId: (user as any).zoneId?.toString(),
    refusalReason: (user as any).refusalReason,
    refusalType: (user as any).refusalType,
    points: (user as any).points ?? 100,
    claimedMissions: (user as any).claimedMissions || [],
  });

  beforeEach(async () => {
    transactionsService = {
      create: jest.fn(),
    };

    const modelConstructor = jest.fn();
    userModel = modelConstructor as any;
    userModel.findOneAndUpdate = jest.fn();
    userModel.findOne = jest.fn();
    userModel.findById = jest.fn();
    userModel.find = jest.fn();
    userModel.countDocuments = jest.fn();
    userModel.findByIdAndUpdate = jest.fn();
    userModel.findByIdAndDelete = jest.fn();

    conversationModel = { countDocuments: jest.fn() };
    postModel = { countDocuments: jest.fn() };
    incidentModel = { countDocuments: jest.fn() };
    eventModel = { countDocuments: jest.fn() };
    moderatorApplicationModel = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: getModelToken(Conversation.name),
          useValue: conversationModel,
        },
        {
          provide: getModelToken(Post.name),
          useValue: postModel,
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
          provide: getModelToken(ModeratorApplication.name),
          useValue: moderatorApplicationModel,
        },
        {
          provide: TransactionsService,
          useValue: transactionsService,
        },
        {
          provide: EmailsService,
          useValue: {
            sendAccountDeletedEmail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncFromAuth0', () => {
    it('should sync a user profile and return a dto', async () => {
      const dbUser = makeUser({ name: undefined, picture: undefined });
      const user = makeUser();
      userModel.findOne.mockResolvedValue(dbUser);
      userModel.findOneAndUpdate.mockResolvedValue(user);

      const result = await service.syncFromAuth0(user.auth0Id, {
        email: user.email,
        name: user.name,
        picture: user.picture,
      });

      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: user.auth0Id },
        {
          $set: {
            email: user.email,
            name: user.name,
            picture: user.picture,
          },
        },
        { returnDocument: 'after' },
      );
      expect(result).toEqual(toExpectedDto(user));
    });

    it('should sync only required fields when optional values are missing', async () => {
      const user = makeUser({ name: undefined, picture: undefined });
      userModel.findOne.mockResolvedValue(user);
      userModel.findOneAndUpdate.mockResolvedValue(user);

      await service.syncFromAuth0(user.auth0Id, {
        email: user.email,
      });

      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: user.auth0Id },
        {
          $set: {
            email: user.email,
          },
        },
        { returnDocument: 'after' },
      );
    });

    it('should throw InternalServerErrorException when persistence fails', async () => {
      userModel.findOneAndUpdate.mockRejectedValue(
        new Error('Mongo unavailable'),
      );

      await expect(
        service.syncFromAuth0('auth0|broken', {
          email: 'broken@example.com',
        }),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.syncFromAuth0('auth0|broken', {
          email: 'broken@example.com',
        }),
      ).rejects.toThrow('Erreur lors de la synchronisation du profil');
    });

    it('should sync a new user and create welcome points transaction', async () => {
      userModel.findOne.mockResolvedValue(null);
      const savedUser = makeUser({ points: 100 });
      const save = jest.fn().mockResolvedValue(savedUser);
      userModel.mockImplementation(() => ({
        ...savedUser,
        save,
      }));

      const result = await service.syncFromAuth0('auth0|newuser', {
        email: 'new@example.com',
        name: 'New User',
        picture: 'pic.jpg',
      });

      expect(userModel).toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(transactionsService.create).toHaveBeenCalledWith(
        null,
        savedUser._id,
        100,
        'welcome_grant',
        'Cadeau de Bienvenue Hoodly',
      );
      expect(result).toBeDefined();
    });

    it('should handle welcome transaction error gracefully when syncing a new user', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      userModel.findOne.mockResolvedValue(null);
      const savedUser = makeUser({ points: 100 });
      const save = jest.fn().mockResolvedValue(savedUser);
      userModel.mockImplementation(() => ({
        ...savedUser,
        save,
      }));
      transactionsService.create.mockRejectedValue(
        new Error('Transaction failed'),
      );

      const result = await service.syncFromAuth0('auth0|newuser', {
        email: 'new@example.com',
      });

      expect(userModel).toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(result).toBeDefined();
      warnSpy.mockRestore();
    });
  });

  describe('getProfileByAuth0Id', () => {
    it('should return the user profile dto when user exists', async () => {
      const user = makeUser();
      userModel.findOne.mockResolvedValue(user);

      const result = await service.getProfileByAuth0Id(user.auth0Id);

      expect(userModel.findOne).toHaveBeenCalledWith({ auth0Id: user.auth0Id });
      expect(result).toEqual(toExpectedDto(user));
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(
        service.getProfileByAuth0Id('auth0|missing'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getProfileByAuth0Id('auth0|missing'),
      ).rejects.toThrow('Utilisateur introuvable');
    });
  });

  describe('findById', () => {
    it('should delegate to model.findById', async () => {
      const user = makeUser();
      userModel.findById.mockResolvedValue(user);

      const result = await service.findById(user._id);

      expect(userModel.findById).toHaveBeenCalledWith(user._id);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('should return paginated users with search filters', async () => {
      const user1 = makeUser({
        _id: '507f191e810c19729de860eb',
        auth0Id: 'auth0|u1',
        email: 'u1@example.com',
      });
      const user2 = makeUser({
        _id: '507f191e810c19729de860ec',
        auth0Id: 'auth0|u2',
        email: 'u2@example.com',
        role: UserRole.ADMIN,
      });

      const lean = jest.fn().mockResolvedValue([user1, user2]);
      const sort = jest.fn().mockReturnValue({ lean });
      const limit = jest.fn().mockReturnValue({ sort });
      const skip = jest.fn().mockReturnValue({ limit });

      userModel.find.mockReturnValue({ skip });
      userModel.countDocuments.mockResolvedValue(25);

      const result = await service.findAll(
        2,
        10,
        'john',
        UserRole.ADMIN,
        false,
      );

      expect(userModel.find).toHaveBeenCalledWith({
        $or: [
          { email: { $regex: 'john', $options: 'i' } },
          { name: { $regex: 'john', $options: 'i' } },
        ],
        role: UserRole.ADMIN,
        isActive: false,
      });
      expect(skip).toHaveBeenCalledWith(10);
      expect(limit).toHaveBeenCalledWith(10);
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(userModel.countDocuments).toHaveBeenCalledWith({
        $or: [
          { email: { $regex: 'john', $options: 'i' } },
          { name: { $regex: 'john', $options: 'i' } },
        ],
        role: UserRole.ADMIN,
        isActive: false,
      });
      expect(result).toEqual({
        users: [toExpectedDto(user1), toExpectedDto(user2)],
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });

    it('should use an empty query when no filters are provided', async () => {
      const user = makeUser();

      const lean = jest.fn().mockResolvedValue([user]);
      const sort = jest.fn().mockReturnValue({ lean });
      const limit = jest.fn().mockReturnValue({ sort });
      const skip = jest.fn().mockReturnValue({ limit });

      userModel.find.mockReturnValue({ skip });
      userModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll();

      expect(userModel.find).toHaveBeenCalledWith({});
      expect(userModel.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({
        users: [toExpectedDto(user)],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('updateUser', () => {
    it('should update an existing user and return a dto', async () => {
      const user = makeUser({ role: UserRole.MODERATOR, isActive: false });
      userModel.findByIdAndUpdate.mockResolvedValue(user);

      const result = await service.updateUser(user._id, {
        role: UserRole.MODERATOR,
        isActive: false,
      });

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        user._id,
        { $set: { role: UserRole.MODERATOR, isActive: false } },
        { returnDocument: 'after' },
      );
      expect(result).toEqual(toExpectedDto(user));
    });

    it('should throw NotFoundException when updating a missing user', async () => {
      userModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateUser('507f191e810c19729de860ef', {
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateUser('507f191e810c19729de860ef', {
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow('Utilisateur introuvable');
    });
  });

  describe('deleteUser', () => {
    it('should delete an existing user and return a confirmation', async () => {
      const user = makeUser();
      userModel.findByIdAndDelete.mockResolvedValue(user);

      const result = await service.deleteUser(user._id);

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(user._id);
      expect(result).toEqual({ message: 'Utilisateur supprimé' });
    });

    it('should throw NotFoundException when deleting a missing user', async () => {
      userModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(
        service.deleteUser('507f191e810c19729de860ff'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteUser('507f191e810c19729de860ff'),
      ).rejects.toThrow('Utilisateur introuvable');
    });
  });

  describe('updateProfile', () => {
    it('should update profile and return DTO', async () => {
      const updatedUser = makeUser({ name: 'Updated Name', points: 100 });
      userModel.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('auth0|abc123', {
        name: 'Updated Name',
      });

      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: 'auth0|abc123' },
        { $set: { name: 'Updated Name' } },
        { returnDocument: 'after' },
      );
      expect(result.name).toEqual('Updated Name');
    });

    it('should throw NotFoundException when user not found on update', async () => {
      userModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateProfile('auth0|abc123', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('claimMission', () => {
    it('should claim mission successfully when conditions are met', async () => {
      const user = {
        ...makeUser({ points: 100, claimedMissions: [] }),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      userModel.findOne.mockResolvedValue(user);
      conversationModel.countDocuments.mockResolvedValue(1);

      const result = await service.claimMission('auth0|abc123', 'discussion');

      expect(user.save).toHaveBeenCalled();
      expect(user.points).toEqual(110);
      expect(user.claimedMissions).toContain('discussion');
      expect(transactionsService.create).toHaveBeenCalled();
      expect(result.points).toEqual(110);
      expect(result.claimedMissions).toContain('discussion');
    });

    it('should throw BadRequestException if mission is already claimed', async () => {
      const user = makeUser({ points: 100, claimedMissions: ['discussion'] });
      userModel.findOne.mockResolvedValue(user);

      await expect(
        service.claimMission('auth0|abc123', 'discussion'),
      ).rejects.toThrow(
        'Vous avez déjà récupéré la récompense pour cette mission.',
      );
    });

    it('should throw BadRequestException if mission criteria not met', async () => {
      const user = makeUser({ points: 100, claimedMissions: [] });
      userModel.findOne.mockResolvedValue(user);
      conversationModel.countDocuments.mockResolvedValue(0);

      await expect(
        service.claimMission('auth0|abc123', 'discussion'),
      ).rejects.toThrow(
        "Vous n'avez pas encore accompli les conditions pour cette mission.",
      );
    });
  });

  describe('findVoisins', () => {
    it('should return neighbors in the same zone when global is false', async () => {
      const user1 = makeUser({ _id: '1', zoneId: '507f191e810c19729de860bb' });
      const user2 = makeUser({ _id: '2', zoneId: '507f191e810c19729de860bb' });
      const lean = jest.fn().mockResolvedValue([user2]);
      const limit = jest.fn().mockReturnValue({ lean });
      userModel.find.mockReturnValue({ limit });

      const result = await service.findVoisins(
        '1',
        '507f191e810c19729de860bb',
        undefined,
        false,
      );

      expect(userModel.find).toHaveBeenCalledWith({
        _id: { $ne: '1' },
        isActive: true,
        zoneId: new Types.ObjectId('507f191e810c19729de860bb'),
      });
      expect(limit).toHaveBeenCalledWith(20);
      expect(result).toEqual([
        {
          id: '2',
          name: user2.name,
          email: user2.email,
          picture: user2.picture,
          zoneId: '507f191e810c19729de860bb',
        },
      ]);
    });

    it('should return neighbors globally when global is true', async () => {
      const user1 = makeUser({ _id: '1', zoneId: '507f191e810c19729de860bb' });
      const user2 = makeUser({ _id: '2', zoneId: '507f191e810c19729de860bc' });
      const lean = jest.fn().mockResolvedValue([user2]);
      const limit = jest.fn().mockReturnValue({ lean });
      userModel.find.mockReturnValue({ limit });

      const result = await service.findVoisins(
        '1',
        '507f191e810c19729de860bb',
        undefined,
        true,
      );

      expect(userModel.find).toHaveBeenCalledWith({
        _id: { $ne: '1' },
        isActive: true,
      });
      expect(result).toEqual([
        {
          id: '2',
          name: user2.name,
          email: user2.email,
          picture: user2.picture,
          zoneId: '507f191e810c19729de860bc',
        },
      ]);
    });

    it('should filter neighbors by search query', async () => {
      const lean = jest.fn().mockResolvedValue([]);
      const limit = jest.fn().mockReturnValue({ lean });
      userModel.find.mockReturnValue({ limit });

      await service.findVoisins('1', '507f191e810c19729de860bb', 'alex', false);

      expect(userModel.find).toHaveBeenCalledWith({
        _id: { $ne: '1' },
        isActive: true,
        zoneId: new Types.ObjectId('507f191e810c19729de860bb'),
        $or: [
          { email: { $regex: 'alex', $options: 'i' } },
          { name: { $regex: 'alex', $options: 'i' } },
        ],
      });
    });
  });
});
