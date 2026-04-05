import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from '../schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: {
    findOneAndUpdate: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };

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
  });

  beforeEach(async () => {
    userModel = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
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
      const user = makeUser();
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
          $setOnInsert: { role: 'user', isActive: true },
        },
        { upsert: true, returnDocument: 'after' },
      );
      expect(result).toEqual(toExpectedDto(user));
    });

    it('should sync only required fields when optional values are missing', async () => {
      const user = makeUser({ name: undefined, picture: undefined });
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
          $setOnInsert: { role: 'user', isActive: true },
        },
        { upsert: true, returnDocument: 'after' },
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
});
