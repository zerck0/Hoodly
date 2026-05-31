import { Test, TestingModule } from '@nestjs/testing';
import { RgpdController } from './rgpd.controller';
import { RgpdService } from './rgpd.service';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';
import { UserRole } from '../users/schemas/user.schema';

describe('RgpdController', () => {
  let controller: RgpdController;
  let service: RgpdService;

  const mockRgpdService = {
    exportUserData: jest.fn(),
    anonymizeUserData: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RgpdController],
      providers: [
        {
          provide: RgpdService,
          useValue: mockRgpdService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RgpdController>(RgpdController);
    service = module.get<RgpdService>(RgpdService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportData', () => {
    it('should call exportUserData service method', async () => {
      const user = { userId: 'user-id', role: UserRole.USER, sub: 'sub-id' };
      const expectedResult = { profile: {} };
      mockRgpdService.exportUserData.mockResolvedValueOnce(expectedResult);

      const result = await controller.exportData(user);

      expect(result).toBe(expectedResult);
      expect(mockRgpdService.exportUserData).toHaveBeenCalledWith('user-id');
    });
  });

  describe('anonymizeData', () => {
    it('should call anonymizeUserData service method', async () => {
      const user = { userId: 'user-id', role: UserRole.USER, sub: 'sub-id' };
      const expectedResult = { message: 'Success' };
      mockRgpdService.anonymizeUserData.mockResolvedValueOnce(expectedResult);

      const result = await controller.anonymizeData(user);

      expect(result).toBe(expectedResult);
      expect(mockRgpdService.anonymizeUserData).toHaveBeenCalledWith('user-id');
    });
  });
});
