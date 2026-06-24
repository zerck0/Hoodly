import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ContractsService } from './contracts.service';
import { Contract, ContractStatus } from './schemas/contract.schema';
import { Service, ServiceStatus } from '../services/schemas/service.schema';
import { UsersService } from '../users/services/users.service';
import { TransactionsService } from '../transactions/services/transactions.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('ContractsService', () => {
  let service: ContractsService;
  let usersService: UsersService;
  let transactionsService: TransactionsService;

  let mockContractDoc: any;
  let mockServiceDoc: any;

  let mockContractModel: any;
  let mockServiceModel: any;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockTransactionsService = {
    transferPoints: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockContractDoc = {
      _id: new Types.ObjectId(),
      clientId: new Types.ObjectId(),
      providerId: new Types.ObjectId(),
      serviceId: new Types.ObjectId(),
      title: 'Test Contract',
      terms: 'These are the terms of the contract.',
      pricePoints: 50,
      status: ContractStatus.PENDING,
      clientSignature: { signed: false },
      providerSignature: { signed: false },
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockServiceDoc = {
      _id: new Types.ObjectId(),
      contractId: null,
      statut: ServiceStatus.ACTIF,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockContractModel = jest.fn().mockImplementation((dto) => {
      return {
        ...dto,
        _id: new Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          ...dto,
          _id: new Types.ObjectId(),
        }),
      };
    });

    mockContractModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockContractDoc),
      populate: jest.fn().mockReturnThis(),
    });
    const queryChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockContractDoc),
    };
    mockContractModel.findById.mockReturnValue(queryChain);
    mockContractModel.find = jest.fn().mockReturnValue(queryChain);

    mockServiceModel = {
      findById: jest.fn().mockResolvedValue(mockServiceDoc),
      findByIdAndUpdate: jest.fn().mockResolvedValue(mockServiceDoc),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: getModelToken(Contract.name),
          useValue: mockContractModel,
        },
        {
          provide: getModelToken(Service.name),
          useValue: mockServiceModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    usersService = module.get<UsersService>(UsersService);
    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a contract successfully', async () => {
      const clientId = new Types.ObjectId().toString();
      const providerId = new Types.ObjectId().toString();
      const serviceId = new Types.ObjectId().toString();

      const createDto: any = {
        clientId,
        providerId,
        serviceId,
        title: 'Need tutoring',
        terms: 'Help with NestJS unit testing',
        pricePoints: 30,
      };

      const mockClient = { _id: clientId, points: 100 };
      const mockProvider = { _id: providerId, points: 50 };

      mockUsersService.findById
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockProvider);

      mockServiceModel.findById.mockResolvedValueOnce(mockServiceDoc);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockUsersService.findById).toHaveBeenCalledWith(clientId);
      expect(mockUsersService.findById).toHaveBeenCalledWith(providerId);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(serviceId);
      expect(mockServiceDoc.statut).toBe(ServiceStatus.EN_COURS);
      expect(mockServiceDoc.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if client and provider are the same', async () => {
      const clientId = new Types.ObjectId().toString();
      const createDto: any = {
        clientId,
        providerId: clientId,
        serviceId: new Types.ObjectId().toString(),
        title: 'Self service',
        terms: 'Cannot contract with self',
        pricePoints: 10,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if client is not found', async () => {
      const createDto: any = {
        clientId: new Types.ObjectId().toString(),
        providerId: new Types.ObjectId().toString(),
        serviceId: new Types.ObjectId().toString(),
        title: 'Title',
        terms: 'Terms',
        pricePoints: 10,
      };

      mockUsersService.findById
        .mockResolvedValueOnce(null) // Client
        .mockResolvedValueOnce({}); // Provider

      mockServiceModel.findById.mockResolvedValueOnce({});

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if provider is not found', async () => {
      const createDto: any = {
        clientId: new Types.ObjectId().toString(),
        providerId: new Types.ObjectId().toString(),
        serviceId: new Types.ObjectId().toString(),
        title: 'Title',
        terms: 'Terms',
        pricePoints: 10,
      };

      mockUsersService.findById
        .mockResolvedValueOnce({}) // Client
        .mockResolvedValueOnce(null); // Provider

      mockServiceModel.findById.mockResolvedValueOnce({});

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if service is not found', async () => {
      const createDto: any = {
        clientId: new Types.ObjectId().toString(),
        providerId: new Types.ObjectId().toString(),
        serviceId: new Types.ObjectId().toString(),
        title: 'Title',
        terms: 'Terms',
        pricePoints: 10,
      };

      mockUsersService.findById
        .mockResolvedValueOnce({}) // Client
        .mockResolvedValueOnce({}); // Provider

      mockServiceModel.findById.mockResolvedValueOnce(null); // Service

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if client has insufficient points', async () => {
      const clientId = new Types.ObjectId().toString();
      const providerId = new Types.ObjectId().toString();
      const serviceId = new Types.ObjectId().toString();

      const createDto: any = {
        clientId,
        providerId,
        serviceId,
        title: 'Expensive class',
        terms: 'High cost',
        pricePoints: 200,
      };

      const mockClient = { _id: clientId, points: 50 };
      const mockProvider = { _id: providerId, points: 50 };

      mockUsersService.findById
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockProvider);

      mockServiceModel.findById.mockResolvedValueOnce(mockServiceDoc);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sign', () => {
    it('should allow the client to sign the contract', async () => {
      const userId = new Types.ObjectId();
      mockContractDoc.clientId = userId;
      mockContractDoc.providerId = new Types.ObjectId();
      mockContractDoc.status = ContractStatus.PENDING;
      mockContractDoc.clientSignature = { signed: false };

      const signDto = {
        ipAddress: '192.168.1.1',
        signatureMetadata: 'UserAgent String',
      };

      const result = await service.sign(
        mockContractDoc._id.toString(),
        userId.toString(),
        signDto as any,
      );

      expect(result.clientSignature.signed).toBe(true);
      expect(result.clientSignature.ipAddress).toBe('192.168.1.1');
      expect(result.clientSignature.hash).toBeDefined();
      expect(result.status).toBe(ContractStatus.PENDING);
    });

    it('should allow the provider to sign the contract', async () => {
      const userId = new Types.ObjectId();
      mockContractDoc.clientId = new Types.ObjectId();
      mockContractDoc.providerId = userId;
      mockContractDoc.status = ContractStatus.PENDING;
      mockContractDoc.providerSignature = { signed: false };

      const signDto = {
        ipAddress: '192.168.1.1',
        signatureMetadata: 'UserAgent String',
      };

      const result = await service.sign(
        mockContractDoc._id.toString(),
        userId.toString(),
        signDto as any,
      );

      expect(result.providerSignature.signed).toBe(true);
      expect(result.status).toBe(ContractStatus.PENDING);
    });

    it('should set status to SIGNED when both sign', async () => {
      const userId = new Types.ObjectId();
      mockContractDoc.clientId = new Types.ObjectId();
      mockContractDoc.providerId = userId;
      mockContractDoc.status = ContractStatus.PENDING;
      mockContractDoc.clientSignature = { signed: true };
      mockContractDoc.providerSignature = { signed: false };

      const signDto = {};

      const result = await service.sign(
        mockContractDoc._id.toString(),
        userId.toString(),
        signDto as any,
      );

      expect(result.providerSignature.signed).toBe(true);
      expect(result.status).toBe(ContractStatus.SIGNED);
    });

    it('should throw NotFoundException if contract does not exist', async () => {
      mockContractModel.findById().exec.mockResolvedValueOnce(null);

      await expect(service.sign('any-id', 'any-user', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if contract is not PENDING', async () => {
      mockContractDoc.status = ContractStatus.COMPLETED;

      await expect(
        service.sign(mockContractDoc._id.toString(), 'any-user', {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not part of the contract', async () => {
      mockContractDoc.clientId = new Types.ObjectId();
      mockContractDoc.providerId = new Types.ObjectId();
      mockContractDoc.status = ContractStatus.PENDING;

      await expect(
        service.sign(
          mockContractDoc._id.toString(),
          new Types.ObjectId().toString(),
          {} as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if client has already signed', async () => {
      const userId = new Types.ObjectId();
      mockContractDoc.clientId = userId;
      mockContractDoc.status = ContractStatus.PENDING;
      mockContractDoc.clientSignature = { signed: true };

      await expect(
        service.sign(mockContractDoc._id.toString(), userId.toString(), {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if provider has already signed', async () => {
      const userId = new Types.ObjectId();
      mockContractDoc.providerId = userId;
      mockContractDoc.status = ContractStatus.PENDING;
      mockContractDoc.providerSignature = { signed: true };

      await expect(
        service.sign(mockContractDoc._id.toString(), userId.toString(), {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('should complete the contract successfully', async () => {
      const clientObjectId = new Types.ObjectId();
      const providerObjectId = new Types.ObjectId();
      const serviceObjectId = new Types.ObjectId();

      mockContractDoc.clientId = clientObjectId;
      mockContractDoc.providerId = providerObjectId;
      mockContractDoc.serviceId = serviceObjectId;
      mockContractDoc.status = ContractStatus.SIGNED;

      const result = await service.complete(
        mockContractDoc._id.toString(),
        clientObjectId.toString(),
      );

      expect(result.status).toBe(ContractStatus.COMPLETED);
      expect(mockTransactionsService.transferPoints).toHaveBeenCalledWith(
        clientObjectId.toString(),
        providerObjectId.toString(),
        mockContractDoc.pricePoints,
        `Paiement pour le service sous contrat : ${mockContractDoc.title}`,
        serviceObjectId.toString(),
      );
      expect(mockServiceModel.findByIdAndUpdate).toHaveBeenCalledWith(
        serviceObjectId,
        {
          statut: ServiceStatus.TERMINE,
          realisationValidee: true,
        },
      );
    });

    it('should throw NotFoundException if contract not found', async () => {
      mockContractModel.findById().exec.mockResolvedValueOnce(null);

      await expect(service.complete('id', 'userId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if contract is not SIGNED', async () => {
      mockContractDoc.status = ContractStatus.PENDING;

      await expect(
        service.complete(mockContractDoc._id.toString(), 'userId'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user not authorized to close contract', async () => {
      mockContractDoc.clientId = new Types.ObjectId();
      mockContractDoc.providerId = new Types.ObjectId();
      mockContractDoc.status = ContractStatus.SIGNED;

      await expect(
        service.complete(
          mockContractDoc._id.toString(),
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancel', () => {
    it('should cancel the contract successfully', async () => {
      const clientObjectId = new Types.ObjectId();
      mockContractDoc.clientId = clientObjectId;
      mockContractDoc.status = ContractStatus.PENDING;

      const result = await service.cancel(
        mockContractDoc._id.toString(),
        clientObjectId.toString(),
      );

      expect(result.status).toBe(ContractStatus.CANCELLED);
      expect(mockServiceModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockContractDoc.serviceId,
        {
          statut: ServiceStatus.ANNULE,
        },
      );
    });

    it('should throw NotFoundException if contract not found', async () => {
      mockContractModel.findById().exec.mockResolvedValueOnce(null);

      await expect(service.cancel('id', 'userId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if contract is already COMPLETED or CANCELLED', async () => {
      mockContractDoc.status = ContractStatus.COMPLETED;

      await expect(
        service.cancel(mockContractDoc._id.toString(), 'userId'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user not authorized to cancel', async () => {
      mockContractDoc.clientId = new Types.ObjectId();
      mockContractDoc.providerId = new Types.ObjectId();
      mockContractDoc.status = ContractStatus.PENDING;

      await expect(
        service.cancel(
          mockContractDoc._id.toString(),
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return the contract if user is client', async () => {
      const clientObjectId = new Types.ObjectId();
      mockContractDoc.clientId = { _id: clientObjectId };
      mockContractDoc.providerId = { _id: new Types.ObjectId() };

      const finalDoc = {
        ...mockContractDoc,
        clientId: { _id: clientObjectId },
        providerId: { _id: new Types.ObjectId() },
      };

      const chain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(finalDoc),
      };
      mockContractModel.findById.mockReturnValue(chain);

      const result = await service.findOne(
        mockContractDoc._id.toString(),
        clientObjectId.toString(),
      );

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if contract does not exist', async () => {
      const chain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      mockContractModel.findById.mockReturnValue(chain);

      await expect(service.findOne('any-id', 'any-user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not part of the contract', async () => {
      const finalDoc = {
        ...mockContractDoc,
        clientId: { _id: new Types.ObjectId() },
        providerId: { _id: new Types.ObjectId() },
      };

      const chain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(finalDoc),
      };
      mockContractModel.findById.mockReturnValue(chain);

      await expect(
        service.findOne(
          mockContractDoc._id.toString(),
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllForUser', () => {
    it('should return all contracts for user', async () => {
      const userId = new Types.ObjectId();
      const list = [mockContractDoc];

      const chain = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(list),
      };
      mockContractModel.find.mockReturnValue(chain);

      const result = await service.findAllForUser(userId.toString());

      expect(result).toEqual(list);
      expect(mockContractModel.find).toHaveBeenCalledWith({
        $or: [{ clientId: userId }, { providerId: userId }],
      });
    });
  });
});
