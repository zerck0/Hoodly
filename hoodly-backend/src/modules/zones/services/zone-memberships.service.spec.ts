import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ZoneMembershipsService } from './zone-memberships.service';
import { ZoneMembership } from '../schemas/zone-membership.schema';
import { User } from '../../users/schemas/user.schema';
import { Zone } from '../schemas/zone.schema';
import { RequestStatus } from '../enums/request-status.enum';
import { EmailsService } from '../../emails/emails.service';

describe('ZoneMembershipsService', () => {
  let service: ZoneMembershipsService;
  let zoneMembershipModel: any;
  let userModel: any;
  let zoneModel: any;

  const mockUserDoc = {
    _id: new Types.ObjectId(),
    name: 'John Doe',
    auth0Id: 'auth0|123',
    points: 10,
  };

  const mockZoneDoc = {
    _id: new Types.ObjectId(),
    nom: 'Downtown',
  };

  const mockMembershipDoc = {
    _id: new Types.ObjectId(),
    userId: mockUserDoc._id,
    zoneId: mockZoneDoc._id,
    statut: RequestStatus.PENDING,
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockMshpModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));

    const queryMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockMembershipDoc]),
    };

    (mockMshpModel as any).find = jest.fn().mockReturnValue(queryMock);
    (mockMshpModel as any).findOne = jest.fn().mockResolvedValue(null);
    (mockMshpModel as any).findById = jest.fn().mockResolvedValue(mockMembershipDoc);
    (mockMshpModel as any).findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockMembershipDoc),
    });

    const mockUsrModel = jest.fn();
    (mockUsrModel as any).findOne = jest.fn().mockResolvedValue(mockUserDoc);
    (mockUsrModel as any).findById = jest.fn().mockResolvedValue(mockUserDoc);
    (mockUsrModel as any).findByIdAndUpdate = jest.fn().mockResolvedValue(mockUserDoc);

    const mockZModel = jest.fn();
    (mockZModel as any).findById = jest.fn().mockResolvedValue(mockZoneDoc);
    (mockZModel as any).findByIdAndUpdate = jest.fn().mockResolvedValue(mockZoneDoc);

    const mockEmailsService = {
      sendWelcomeJoinEmail: jest.fn().mockResolvedValue(true),
      sendMembershipApprovedEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZoneMembershipsService,
        { provide: getModelToken(ZoneMembership.name), useValue: mockMshpModel },
        { provide: getModelToken(User.name), useValue: mockUsrModel },
        { provide: getModelToken(Zone.name), useValue: mockZModel },
        { provide: EmailsService, useValue: mockEmailsService },
      ],
    }).compile();

    service = module.get<ZoneMembershipsService>(ZoneMembershipsService);
    zoneMembershipModel = module.get(getModelToken(ZoneMembership.name));
    userModel = module.get(getModelToken(User.name));
    zoneModel = module.get(getModelToken(Zone.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create zone membership successfully', async () => {
      const result = await service.create(
        mockZoneDoc._id.toString(),
        'auth0|123',
        'http://aws.com/justif.png',
        'http://aws.com/id.png',
      );

      expect(result).toBeDefined();
      expect(zoneMembershipModel).toHaveBeenCalled();
    });

    it('should throw BadRequestException if pending request already exists', async () => {
      zoneMembershipModel.findOne.mockResolvedValueOnce(mockMembershipDoc);

      await expect(
        service.create(mockZoneDoc._id.toString(), 'auth0|123', 'url', 'url'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('intent', () => {
    it('should set zone intent on user profile', async () => {
      const result = await service.intent(mockZoneDoc._id.toString(), 'auth0|123');
      expect(result).toBeDefined();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return pending memberships', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockMembershipDoc]);
    });
  });

  describe('accept', () => {
    it('should accept membership request successfully', async () => {
      const result = await service.accept(mockMembershipDoc._id.toString(), 'auth0|admin');
      expect(result).toBeDefined();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(zoneModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('refuse', () => {
    it('should refuse membership request successfully', async () => {
      const result = await service.refuse(mockMembershipDoc._id.toString(), 'auth0|admin', 'Invalide');
      expect(result).toBeDefined();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
