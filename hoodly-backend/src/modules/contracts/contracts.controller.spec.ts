import { Test, TestingModule } from '@nestjs/testing';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';

describe('ContractsController', () => {
  let controller: ContractsController;
  let service: ContractsService;

  const mockContractsService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    sign: jest.fn(),
    complete: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [
        {
          provide: ContractsService,
          useValue: mockContractsService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ContractsController>(ContractsController);
    service = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = {
        clientId: 'client-id',
        providerId: 'provider-id',
        serviceId: 'service-id',
        price: 100,
        description: 'Description',
      };
      mockContractsService.create.mockResolvedValueOnce({ _id: 'contract-id' });

      const result = await controller.create(dto as any);

      expect(result).toEqual({ _id: 'contract-id' });
      expect(mockContractsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllForUser', () => {
    it('should call service.findAllForUser', async () => {
      const user = { userId: 'user-id', role: 'user' };
      mockContractsService.findAllForUser.mockResolvedValueOnce([]);

      const result = await controller.findAllForUser(user);

      expect(result).toEqual([]);
      expect(mockContractsService.findAllForUser).toHaveBeenCalledWith(
        'user-id',
      );
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      const user = { userId: 'user-id', role: 'user' };
      mockContractsService.findOne.mockResolvedValueOnce({
        _id: 'contract-id',
      });

      const result = await controller.findOne('contract-id', user);

      expect(result).toEqual({ _id: 'contract-id' });
      expect(mockContractsService.findOne).toHaveBeenCalledWith(
        'contract-id',
        'user-id',
      );
    });
  });

  describe('sign', () => {
    it('should call service.sign', async () => {
      const user = { userId: 'user-id', role: 'user' };
      const dto = { signatureName: 'John Doe', ipAddress: '192.168.1.1' };
      mockContractsService.sign.mockResolvedValueOnce({ _id: 'contract-id' });

      const result = await controller.sign(
        'contract-id',
        user,
        dto as any,
        '127.0.0.1',
      );

      expect(result).toEqual({ _id: 'contract-id' });
      expect(mockContractsService.sign).toHaveBeenCalledWith(
        'contract-id',
        'user-id',
        dto,
      );
    });

    it('should use request IP if ipAddress is not in dto', async () => {
      const user = { userId: 'user-id', role: 'user' };
      const dto: any = { signatureName: 'John Doe' };
      mockContractsService.sign.mockResolvedValueOnce({ _id: 'contract-id' });

      await controller.sign('contract-id', user, dto, '127.0.0.1');

      expect(dto.ipAddress).toBe('127.0.0.1');
    });

    it('should default request IP to 127.0.0.1 if falsy and ipAddress is not in dto', async () => {
      const user = { userId: 'user-id', role: 'user' };
      const dto: any = { signatureName: 'John Doe' };
      mockContractsService.sign.mockResolvedValueOnce({ _id: 'contract-id' });

      await controller.sign('contract-id', user, dto, '');

      expect(dto.ipAddress).toBe('127.0.0.1');
    });
  });

  describe('complete', () => {
    it('should call service.complete', async () => {
      const user = { userId: 'user-id', role: 'user' };
      mockContractsService.complete.mockResolvedValueOnce({
        _id: 'contract-id',
      });

      const result = await controller.complete('contract-id', user);

      expect(result).toEqual({ _id: 'contract-id' });
      expect(mockContractsService.complete).toHaveBeenCalledWith(
        'contract-id',
        'user-id',
      );
    });
  });

  describe('cancel', () => {
    it('should call service.cancel', async () => {
      const user = { userId: 'user-id', role: 'user' };
      mockContractsService.cancel.mockResolvedValueOnce({ _id: 'contract-id' });

      const result = await controller.cancel('contract-id', user);

      expect(result).toEqual({ _id: 'contract-id' });
      expect(mockContractsService.cancel).toHaveBeenCalledWith(
        'contract-id',
        'user-id',
      );
    });
  });
});
