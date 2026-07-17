import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RgpdService } from './rgpd.service';
import { User } from '../users/schemas/user.schema';
import { Message } from '../conversations/schemas/message.schema';
import { Post } from '../posts/schemas/post.schema';
import { Comment } from '../posts/schemas/comment.schema';
import { Incident } from '../incidents/schemas/incident.schema';
import { Transaction } from '../transactions/schemas/transaction.schema';
import { NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { EmailsService } from '../emails/emails.service';

describe('RgpdService', () => {
  let service: RgpdService;

  let mockUserModel: any;
  let mockMessageModel: any;
  let mockPostModel: any;
  let mockCommentModel: any;
  let mockIncidentModel: any;
  let mockTransactionModel: any;

  let mockUser: any;
  let mockUserObjectId: Types.ObjectId;

  beforeEach(async () => {
    mockUserObjectId = new Types.ObjectId();
    mockUser = {
      _id: mockUserObjectId,
      email: 'test@hoodly.local',
      name: 'Test User',
      picture: 'test.png',
      phone: '123456789',
      auth0Id: 'auth0|123',
      isActive: true,
      points: 100,
    };

    const createExecMock = (value: any) => ({
      exec: jest.fn().mockResolvedValue(value),
    });

    const createLeanExecMock = (value: any) => ({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(value),
      }),
    });

    // Mock User Model
    mockUserModel = {
      findById: jest.fn().mockImplementation((id: string) => {
        return {
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUser),
          }),
          exec: jest.fn().mockResolvedValue(mockUser),
        };
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue(createExecMock(mockUser)),
    };

    // Mock Message Model
    mockMessageModel = {
      find: jest.fn().mockReturnValue(
        createLeanExecMock([
          {
            _id: new Types.ObjectId(),
            senderId: mockUserObjectId,
            content: 'Hello',
          },
        ]),
      ),
      deleteMany: jest
        .fn()
        .mockReturnValue(createExecMock({ deletedCount: 1 })),
    };

    // Mock Post Model
    mockPostModel = {
      find: jest.fn().mockReturnValue(
        createLeanExecMock([
          {
            _id: new Types.ObjectId(),
            author: mockUserObjectId,
            title: 'Title',
          },
        ]),
      ),
      deleteMany: jest
        .fn()
        .mockReturnValue(createExecMock({ deletedCount: 1 })),
    };

    // Mock Comment Model
    mockCommentModel = {
      find: jest.fn().mockReturnValue(
        createLeanExecMock([
          {
            _id: new Types.ObjectId(),
            author: mockUserObjectId,
            content: 'Comment',
          },
        ]),
      ),
      deleteMany: jest
        .fn()
        .mockReturnValue(createExecMock({ deletedCount: 1 })),
    };

    // Mock Incident Model
    mockIncidentModel = {
      find: jest.fn().mockReturnValue(
        createLeanExecMock([
          {
            _id: new Types.ObjectId(),
            signaledPar: mockUserObjectId.toString(),
            title: 'Incident',
          },
        ]),
      ),
      updateMany: jest.fn().mockReturnValue(createExecMock({ nModified: 1 })),
    };

    // Mock Transaction Model
    mockTransactionModel = {
      find: jest.fn().mockReturnValue(
        createLeanExecMock([
          {
            _id: new Types.ObjectId(),
            payerId: mockUserObjectId,
            amount: 50,
          },
        ]),
      ),
      updateMany: jest.fn().mockReturnValue(createExecMock({ nModified: 1 })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RgpdService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
        { provide: getModelToken(Post.name), useValue: mockPostModel },
        { provide: getModelToken(Comment.name), useValue: mockCommentModel },
        { provide: getModelToken(Incident.name), useValue: mockIncidentModel },
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
        {
          provide: Neo4jService,
          useValue: {
            run: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: EmailsService,
          useValue: {
            sendAccountDeletedEmail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<RgpdService>(RgpdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportUserData', () => {
    it('should export all user data successfully', async () => {
      const result = await service.exportUserData(mockUserObjectId.toString());

      expect(result).toBeDefined();
      expect(result.profile).toEqual(mockUser);
      expect(result.messages).toHaveLength(1);
      expect(result.posts).toHaveLength(1);
      expect(result.comments).toHaveLength(1);
      expect(result.incidents).toHaveLength(1);
      expect(result.transactions).toHaveLength(1);

      expect(mockUserModel.findById).toHaveBeenCalledWith(
        mockUserObjectId.toString(),
      );
      expect(mockMessageModel.find).toHaveBeenCalledWith({
        senderId: mockUserObjectId,
      });
      expect(mockPostModel.find).toHaveBeenCalledWith({
        author: mockUserObjectId,
      });
      expect(mockCommentModel.find).toHaveBeenCalledWith({
        author: mockUserObjectId,
      });
    });

    it('should throw NotFoundException if user is not found during export', async () => {
      mockUserModel.findById.mockImplementationOnce(() => {
        return {
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        };
      });

      await expect(
        service.exportUserData(mockUserObjectId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('anonymizeUserData', () => {
    it('should anonymize and delete relevant user data successfully', async () => {
      const result = await service.anonymizeUserData(
        mockUserObjectId.toString(),
      );

      expect(result).toBeDefined();
      expect(result.message).toContain('Données anonymisées avec succès');

      expect(mockUserModel.findById).toHaveBeenCalledWith(
        mockUserObjectId.toString(),
      );
      expect(mockPostModel.deleteMany).toHaveBeenCalledWith({
        author: mockUserObjectId,
      });
      expect(mockCommentModel.deleteMany).toHaveBeenCalledWith({
        author: mockUserObjectId,
      });
      expect(mockMessageModel.deleteMany).toHaveBeenCalledWith({
        senderId: mockUserObjectId,
      });

      expect(mockIncidentModel.updateMany).toHaveBeenCalledWith(
        { signaledPar: mockUserObjectId.toString() },
        { $set: { signaledPar: 'anonymized' } },
      );
      expect(mockIncidentModel.updateMany).toHaveBeenCalledWith(
        { assignedTo: mockUserObjectId },
        { $set: { assignedTo: null } },
      );

      expect(mockTransactionModel.updateMany).toHaveBeenCalledWith(
        { payerId: mockUserObjectId },
        { $set: { payerId: null } },
      );
      expect(mockTransactionModel.updateMany).toHaveBeenCalledWith(
        { recipientId: mockUserObjectId },
        { $set: { recipientId: null } },
      );

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserObjectId.toString(),
        {
          $set: {
            email: `anonymized-${mockUserObjectId.toString()}@hoodly.local`,
            name: 'Utilisateur Anonymisé',
            picture: '',
            phone: '',
            auth0Id: `anonymized-${mockUserObjectId.toString()}`,
            isActive: false,
            points: 0,
            location: undefined,
            zoneId: null,
            zoneStatut: 'sans_zone',
          },
        },
      );
    });

    it('should throw NotFoundException if user is not found during anonymization', async () => {
      mockUserModel.findById.mockImplementationOnce(() => {
        return {
          exec: jest.fn().mockResolvedValue(null),
        };
      });

      await expect(
        service.anonymizeUserData(mockUserObjectId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
