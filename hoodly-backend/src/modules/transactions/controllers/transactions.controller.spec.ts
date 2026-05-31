import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from '../services/transactions.service';
import { TransactionsModule } from '../transactions.module';
import { Transaction } from '../schemas/transaction.schema';
import { User } from '../../users/schemas/user.schema';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    findAllForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyTransactions', () => {
    it('should return all transactions for the current user', async () => {
      const mockUser = { userId: '507f191e810c19729de860aa' };
      const mockResult = [
        { description: 'Transaction 1' },
        { description: 'Transaction 2' },
      ];
      mockTransactionsService.findAllForUser.mockResolvedValue(mockResult);

      const result = await controller.getMyTransactions(mockUser);

      expect(mockTransactionsService.findAllForUser).toHaveBeenCalledWith(
        mockUser.userId,
      );
      expect(result).toEqual(mockResult);
    });
  });
});

describe('TransactionsModule', () => {
  it('should compile the module successfully', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TransactionsModule],
    })
      .overrideProvider(getModelToken(Transaction.name))
      .useValue({})
      .overrideProvider(getModelToken(User.name))
      .useValue({})
      .compile();

    expect(module).toBeDefined();
    expect(
      module.get<TransactionsController>(TransactionsController),
    ).toBeDefined();
    expect(module.get<TransactionsService>(TransactionsService)).toBeDefined();
  });
});
