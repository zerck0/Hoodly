import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from '../schemas/transaction.schema';
import { User } from '../../users/schemas/user.schema';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionModel: jest.Mock & { find: jest.Mock };
  let userModel: {
    findById: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    const modelConstructor = jest.fn();
    transactionModel = modelConstructor as any;
    transactionModel.find = jest.fn();

    userModel = {
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: transactionModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const payerId = '507f191e810c19729de860aa';
    const recipientId = '507f191e810c19729de860ab';
    const serviceId = '507f191e810c19729de860ac';

    it('should successfully create and save a transaction with all optional fields', async () => {
      const mockSaved = {
        payerId: new Types.ObjectId(payerId),
        recipientId: new Types.ObjectId(recipientId),
        amount: 50,
        type: TransactionType.SERVICE_PAYMENT,
        description: 'Prestation de service',
        serviceId: new Types.ObjectId(serviceId),
      };

      const save = jest.fn().mockResolvedValue(mockSaved);
      transactionModel.mockImplementation((data) => ({
        ...data,
        save,
      }));

      const result = await service.create(
        payerId,
        recipientId,
        50,
        TransactionType.SERVICE_PAYMENT,
        'Prestation de service',
        serviceId,
      );

      expect(transactionModel).toHaveBeenCalledWith({
        payerId: new Types.ObjectId(payerId),
        recipientId: new Types.ObjectId(recipientId),
        amount: 50,
        type: TransactionType.SERVICE_PAYMENT,
        description: 'Prestation de service',
        serviceId: new Types.ObjectId(serviceId),
      });
      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSaved);
    });

    it('should successfully create and save a transaction without optional fields', async () => {
      const mockSaved = {
        amount: 100,
        type: TransactionType.WELCOME_GRANT,
        description: 'Points de bienvenue',
      };

      const save = jest.fn().mockResolvedValue(mockSaved);
      transactionModel.mockImplementation((data) => ({
        ...data,
        save,
      }));

      const result = await service.create(
        null,
        null,
        100,
        TransactionType.WELCOME_GRANT,
        'Points de bienvenue',
      );

      expect(transactionModel).toHaveBeenCalledWith({
        amount: 100,
        type: TransactionType.WELCOME_GRANT,
        description: 'Points de bienvenue',
      });
      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSaved);
    });

    it('should throw InternalServerErrorException when save fails', async () => {
      const save = jest.fn().mockRejectedValue(new Error('Database error'));
      transactionModel.mockImplementation((data) => ({
        ...data,
        save,
      }));

      await expect(
        service.create(
          null,
          null,
          100,
          TransactionType.WELCOME_GRANT,
          'Points de bienvenue',
        ),
      ).rejects.toThrow(
        new InternalServerErrorException(
          'Erreur lors de la création de la transaction',
        ),
      );
    });
  });

  describe('transferPoints', () => {
    const payerId = '507f191e810c19729de860aa';
    const recipientId = '507f191e810c19729de860ab';
    const serviceId = '507f191e810c19729de860ac';

    it('should throw NotFoundException if payer is not found', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(
        service.transferPoints(payerId, recipientId, 50, 'Achat service'),
      ).rejects.toThrow(new NotFoundException('Payeur introuvable'));

      expect(userModel.findById).toHaveBeenCalledWith(payerId);
    });

    it('should throw BadRequestException if payer points are insufficient', async () => {
      userModel.findById.mockResolvedValue({
        _id: payerId,
        points: 30,
      });

      await expect(
        service.transferPoints(payerId, recipientId, 50, 'Achat service'),
      ).rejects.toThrow(
        new BadRequestException(
          'Solde de points insuffisant (30 pts) pour régler cette prestation (50 pts).',
        ),
      );
    });

    it('should throw BadRequestException if payer points changed during update', async () => {
      userModel.findById.mockResolvedValue({
        _id: payerId,
        points: 100,
      });
      userModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.transferPoints(payerId, recipientId, 50, 'Achat service'),
      ).rejects.toThrow(
        new BadRequestException(
          'Le solde de points a changé ou est insuffisant lors de la transaction.',
        ),
      );

      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: payerId, points: { $gte: 50 } },
        { $inc: { points: -50 } },
        { new: true },
      );
    });

    it('should refund the payer and throw NotFoundException if recipient is not found during credit', async () => {
      userModel.findById.mockResolvedValue({
        _id: payerId,
        points: 100,
      });
      userModel.findOneAndUpdate.mockResolvedValue({
        _id: payerId,
        points: 50,
      });
      userModel.findByIdAndUpdate.mockImplementation((id) => {
        if (id === recipientId) return null; // recipient not found
        return { _id: payerId };
      });

      await expect(
        service.transferPoints(payerId, recipientId, 50, 'Achat service'),
      ).rejects.toThrow(new NotFoundException('Bénéficiaire introuvable'));

      // Check if refund was performed
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(payerId, {
        $inc: { points: 50 },
      });
    });

    it('should refund the payer and throw InternalServerErrorException if recipient credit fails with database error', async () => {
      userModel.findById.mockResolvedValue({
        _id: payerId,
        points: 100,
      });
      userModel.findOneAndUpdate.mockResolvedValue({
        _id: payerId,
        points: 50,
      });
      userModel.findByIdAndUpdate.mockImplementation((id) => {
        if (id === recipientId) throw new Error('Database down');
        return { _id: payerId };
      });

      await expect(
        service.transferPoints(payerId, recipientId, 50, 'Achat service'),
      ).rejects.toThrow(
        new InternalServerErrorException(
          'Erreur lors du crédit du bénéficiaire. La transaction a été annulée.',
        ),
      );

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(payerId, {
        $inc: { points: 50 },
      });
    });

    it('should refund both payer and recipient, and throw InternalServerErrorException if saving transaction document fails', async () => {
      userModel.findById.mockResolvedValue({
        _id: payerId,
        points: 100,
      });
      userModel.findOneAndUpdate.mockResolvedValue({
        _id: payerId,
        points: 50,
      });
      userModel.findByIdAndUpdate.mockResolvedValue({
        _id: recipientId,
        points: 150,
      });

      // Transaction save failure
      const save = jest
        .fn()
        .mockRejectedValue(new Error('Failed to save document'));
      transactionModel.mockImplementation((data) => ({
        ...data,
        save,
      }));

      await expect(
        service.transferPoints(
          payerId,
          recipientId,
          50,
          'Achat service',
          serviceId,
        ),
      ).rejects.toThrow(
        new InternalServerErrorException(
          'Erreur lors de la création du document de transaction. Les points ont été restitués.',
        ),
      );

      // Verify refund on recipient and payer
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(recipientId, {
        $inc: { points: -50 },
      });
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(payerId, {
        $inc: { points: 50 },
      });
    });

    it('should successfully execute point transfer, create the transaction document and return it on happy path', async () => {
      userModel.findById.mockResolvedValue({
        _id: payerId,
        points: 100,
      });
      userModel.findOneAndUpdate.mockResolvedValue({
        _id: payerId,
        points: 50,
      });
      userModel.findByIdAndUpdate.mockResolvedValue({
        _id: recipientId,
        points: 150,
      });

      const mockSaved = {
        payerId: new Types.ObjectId(payerId),
        recipientId: new Types.ObjectId(recipientId),
        amount: 50,
        type: TransactionType.SERVICE_PAYMENT,
        description: 'Achat service',
        serviceId: new Types.ObjectId(serviceId),
      };

      const save = jest.fn().mockResolvedValue(mockSaved);
      transactionModel.mockImplementation((data) => ({
        ...data,
        save,
      }));

      const result = await service.transferPoints(
        payerId,
        recipientId,
        50,
        'Achat service',
        serviceId,
      );

      expect(userModel.findById).toHaveBeenCalledWith(payerId);
      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: payerId, points: { $gte: 50 } },
        { $inc: { points: -50 } },
        { new: true },
      );
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        recipientId,
        { $inc: { points: 50 } },
        { new: true },
      );
      expect(transactionModel).toHaveBeenCalledWith({
        payerId: new Types.ObjectId(payerId),
        recipientId: new Types.ObjectId(recipientId),
        amount: 50,
        type: TransactionType.SERVICE_PAYMENT,
        description: 'Achat service',
        serviceId: new Types.ObjectId(serviceId),
      });
      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSaved);
    });
  });

  describe('findAllForUser', () => {
    it('should chain find, sort, populate, and exec queries to return list of transactions', async () => {
      const userId = '507f191e810c19729de860aa';
      const userObjectId = new Types.ObjectId(userId);
      const mockResult = [
        { description: 'Prestation 1' },
        { description: 'Prestation 2' },
      ];

      const exec = jest.fn().mockResolvedValue(mockResult);
      const chain = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec,
      };

      transactionModel.find.mockReturnValue(chain);

      const result = await service.findAllForUser(userId);

      expect(transactionModel.find).toHaveBeenCalledWith({
        $or: [{ payerId: userObjectId }, { recipientId: userObjectId }],
      });
      expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(chain.populate).toHaveBeenCalledWith(
        'payerId',
        'name email picture',
      );
      expect(chain.populate).toHaveBeenCalledWith(
        'recipientId',
        'name email picture',
      );
      expect(chain.populate).toHaveBeenCalledWith(
        'serviceId',
        'titre categorie gratuit points',
      );
      expect(exec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });
});
