import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { UserRole } from '../schemas/user.schema';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    updateUser: jest.Mock;
    deleteUser: jest.Mock;
  };

  const makeDto = (overrides: Record<string, unknown> = {}) => {
    const now = new Date('2026-01-01T10:00:00.000Z');

    return {
      id: '507f191e810c19729de860ea',
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

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should parse query params and forward filters to service', async () => {
      const payload = {
        users: [makeDto()],
        total: 1,
        page: 2,
        limit: 25,
        totalPages: 1,
      };
      usersService.findAll.mockResolvedValue(payload);

      const result = await controller.findAll(
        '2',
        '25',
        'john',
        UserRole.ADMIN,
        'true',
      );

      expect(usersService.findAll).toHaveBeenCalledWith(
        2,
        25,
        'john',
        UserRole.ADMIN,
        true,
      );
      expect(result).toEqual(payload);
    });

    it('should use default pagination when query params are missing', async () => {
      const payload = {
        users: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
      usersService.findAll.mockResolvedValue(payload);

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(usersService.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual(payload);
    });
  });

  describe('findOne', () => {
    it('should return user when service finds it', async () => {
      const user = makeDto();
      usersService.findById.mockResolvedValue(user);

      const result = await controller.findOne(user.id);

      expect(usersService.findById).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when service returns null', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        controller.findOne('507f191e810c19729de860ff'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.findOne('507f191e810c19729de860ff'),
      ).rejects.toThrow('Utilisateur introuvable');
    });
  });

  describe('update', () => {
    it('should delegate update to service', async () => {
      const id = '507f191e810c19729de860aa';
      const update = { role: UserRole.MODERATOR, isActive: false };
      const updatedUser = makeDto({
        id,
        role: UserRole.MODERATOR,
        isActive: false,
      });
      usersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.update(id, update);

      expect(usersService.updateUser).toHaveBeenCalledWith(id, update);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delegate delete to service', async () => {
      const id = '507f191e810c19729de860ab';
      const payload = { message: 'Utilisateur supprimé' };
      usersService.deleteUser.mockResolvedValue(payload);

      const result = await controller.remove(id);

      expect(usersService.deleteUser).toHaveBeenCalledWith(id);
      expect(result).toEqual(payload);
    });
  });
});
