import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ZoneRequestsService } from './zone-requests.service';
import { ZoneRequest } from '../schemas/zone-request.schema';
import { User } from '../../users/schemas/user.schema';
import { Zone } from '../schemas/zone.schema';
import { RequestStatus } from '../enums/request-status.enum';
import { EmailsService } from '../../emails/emails.service';

describe('ZoneRequestsService', () => {
  let service: ZoneRequestsService;
  let zoneRequestModel: any;
  let userModel: any;
  let zoneModel: any;

  const mockUserDoc = {
    _id: new Types.ObjectId(),
    name: 'John Doe',
    auth0Id: 'auth0|123',
  };

  const mockZoneDoc = {
    _id: new Types.ObjectId(),
    nom: 'Downtown',
  };

  const mockRequestDoc = {
    _id: new Types.ObjectId(),
    userId: mockUserDoc._id,
    nomQuartier: 'Downtown',
    ville: 'Paris',
    codePostal: '75001',
    statut: RequestStatus.PENDING,
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockReqModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));

    const queryMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockRequestDoc]),
      then: jest.fn().mockImplementation(function (this: any, resolve: any) {
        return Promise.resolve([mockRequestDoc]).then(resolve);
      }),
    };

    (mockReqModel as any).find = jest.fn().mockReturnValue(queryMock);
    (mockReqModel as any).findOne = jest.fn().mockResolvedValue(null);
    (mockReqModel as any).findById = jest.fn().mockResolvedValue(mockRequestDoc);
    (mockReqModel as any).findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockRequestDoc),
    });
    (mockReqModel as any).updateMany = jest.fn().mockResolvedValue({});

    const mockUsrModel = jest.fn();
    (mockUsrModel as any).findOne = jest.fn().mockResolvedValue(mockUserDoc);
    (mockUsrModel as any).findById = jest.fn().mockResolvedValue(mockUserDoc);
    (mockUsrModel as any).find = jest.fn().mockResolvedValue([mockUserDoc]);
    (mockUsrModel as any).findByIdAndUpdate = jest.fn().mockResolvedValue(mockUserDoc);
    (mockUsrModel as any).updateMany = jest.fn().mockResolvedValue({});

    const mockZModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));
    (mockZModel as any).findById = jest.fn().mockResolvedValue(mockZoneDoc);

    const mockEmailsService = {
      sendWelcomeCreationEmail: jest.fn().mockResolvedValue(true),
      sendNeighborhoodCreatedEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZoneRequestsService,
        { provide: getModelToken(ZoneRequest.name), useValue: mockReqModel },
        { provide: getModelToken(User.name), useValue: mockUsrModel },
        { provide: getModelToken(Zone.name), useValue: mockZModel },
        { provide: EmailsService, useValue: mockEmailsService },
      ],
    }).compile();

    service = module.get<ZoneRequestsService>(ZoneRequestsService);
    zoneRequestModel = module.get(getModelToken(ZoneRequest.name));
    userModel = module.get(getModelToken(User.name));
    zoneModel = module.get(getModelToken(Zone.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create zone request successfully', async () => {
      const dto = {
        nomQuartier: 'Downtown',
        ville: 'Paris',
        codePostal: '75001',
        description: 'New neighborhood request',
        longitude: 2.35,
        latitude: 48.85,
      };

      const result = await service.create(dto, 'auth0|123');

      expect(result).toBeDefined();
      expect(zoneRequestModel).toHaveBeenCalled();
    });

    it('should throw BadRequestException if pending request already exists', async () => {
      zoneRequestModel.findOne.mockResolvedValueOnce(mockRequestDoc);
      const dto = { nomQuartier: 'Downtown', ville: 'P', codePostal: '1', description: 'd', longitude: 1, latitude: 1 };

      await expect(service.create(dto, 'auth0|123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return pending requests', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockRequestDoc]);
    });
  });

  describe('bulkAccept', () => {
    it('should accept multiple requests and create zone', async () => {
      const dto = {
        nomQuartier: 'Downtown',
        ville: 'Paris',
        polygone: [[[2.35, 48.85]]],
        commentaire: 'Validé',
        requestIds: [mockRequestDoc._id.toString()],
      };

      const result = await service.bulkAccept(dto, 'auth0|admin');

      expect(result).toBeDefined();
      expect(zoneModel).toHaveBeenCalled();
      expect(zoneRequestModel.updateMany).toHaveBeenCalled();
      expect(userModel.updateMany).toHaveBeenCalled();
    });
  });

  describe('accept', () => {
    it('should accept request individually and create zone', async () => {
      const result = await service.accept(mockRequestDoc._id.toString(), 'auth0|admin', 'OK');

      expect(result).toBeDefined();
      expect(zoneModel).toHaveBeenCalled();
      expect(zoneRequestModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('refuse', () => {
    it('should refuse request successfully', async () => {
      const result = await service.refuse(mockRequestDoc._id.toString(), 'auth0|admin', 'Rejeté');

      expect(result).toBeDefined();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
