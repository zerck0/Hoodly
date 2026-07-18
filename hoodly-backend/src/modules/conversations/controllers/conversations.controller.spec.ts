import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from '../services/conversations.service';
import { Types } from 'mongoose';

describe('ConversationsController', () => {
  let controller: ConversationsController;
  let service: ConversationsService;

  const mockConversationsService = {
    getOrCreate: jest.fn(),
    getUserConversations: jest.fn(),
    findOne: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    editMessage: jest.fn(),
    deleteMessage: jest.fn(),
    proposerCreneau: jest.fn(),
    accepterCreneau: jest.fn(),
    refuserCreneau: jest.fn(),
    annulerPrestation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        { provide: ConversationsService, useValue: mockConversationsService },
      ],
    }).compile();

    controller = module.get<ConversationsController>(ConversationsController);
    service = module.get<ConversationsService>(ConversationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call getOrCreate on service', async () => {
      const dto = { serviceId: 'service123', destinataireId: 'dest123' };
      const user = { userId: 'user123' };
      mockConversationsService.getOrCreate.mockResolvedValueOnce({ _id: 'conv123' });

      const result = await controller.create(dto, user);

      expect(result).toEqual({ _id: 'conv123' });
      expect(service.getOrCreate).toHaveBeenCalledWith('service123', 'user123', 'dest123');
    });
  });

  describe('findMe', () => {
    it('should call getUserConversations on service', async () => {
      const user = { userId: 'user123' };
      const mockResult = [{ _id: 'conv123' }];
      mockConversationsService.getUserConversations.mockResolvedValueOnce(mockResult);

      const result = await controller.findMe(user);

      expect(result).toEqual(mockResult);
      expect(service.getUserConversations).toHaveBeenCalledWith('user123');
    });
  });

  describe('findOne', () => {
    it('should call findOne on service', async () => {
      const id = new Types.ObjectId().toString();
      const user = { userId: 'user123' };
      const mockResult = { _id: id };
      mockConversationsService.findOne.mockResolvedValueOnce(mockResult);

      const result = await controller.findOne(id, user);

      expect(result).toEqual(mockResult);
      expect(service.findOne).toHaveBeenCalledWith(id, 'user123');
    });
  });

  describe('getMessages', () => {
    it('should call getMessages on service', async () => {
      const id = new Types.ObjectId().toString();
      const user = { userId: 'user123' };
      const mockResult = [{ _id: 'msg123' }];
      mockConversationsService.getMessages.mockResolvedValueOnce(mockResult);

      const result = await controller.getMessages(id, user);

      expect(result).toEqual(mockResult);
      expect(service.getMessages).toHaveBeenCalledWith(id, 'user123');
    });
  });

  describe('sendMessage', () => {
    it('should call sendMessage on service', async () => {
      const id = new Types.ObjectId().toString();
      const body = { content: 'hello' };
      const user = { userId: 'user123' };
      const mockResult = { _id: 'msg123' };
      mockConversationsService.sendMessage.mockResolvedValueOnce(mockResult);

      const result = await controller.sendMessage(id, body, user);

      expect(result).toEqual(mockResult);
      expect(service.sendMessage).toHaveBeenCalledWith(id, 'user123', 'hello', undefined);
    });
  });

  describe('editMessage', () => {
    it('should call editMessage on service', async () => {
      const id = new Types.ObjectId().toString();
      const messageId = new Types.ObjectId().toString();
      const body = { content: 'hello updated' };
      const user = { userId: 'user123' };
      const mockResult = { _id: messageId, content: 'hello updated' };
      mockConversationsService.editMessage.mockResolvedValueOnce(mockResult);

      const result = await controller.editMessage(id, messageId, body, user);

      expect(result).toEqual(mockResult);
      expect(service.editMessage).toHaveBeenCalledWith(id, messageId, 'user123', 'hello updated');
    });
  });

  describe('deleteMessage', () => {
    it('should call deleteMessage on service', async () => {
      const id = new Types.ObjectId().toString();
      const messageId = new Types.ObjectId().toString();
      const user = { userId: 'user123' };
      mockConversationsService.deleteMessage.mockResolvedValueOnce(undefined);

      await controller.deleteMessage(id, messageId, user);

      expect(service.deleteMessage).toHaveBeenCalledWith(id, messageId, 'user123');
    });
  });

  describe('proposerCreneau', () => {
    it('should call proposerCreneau on service', async () => {
      const id = new Types.ObjectId().toString();
      const body = { date: '2026-12-01', debut: '10:00', fin: '12:00' };
      const user = { userId: 'user123' };
      const mockResult = { _id: id };
      mockConversationsService.proposerCreneau.mockResolvedValueOnce(mockResult);

      const result = await controller.proposerCreneau(id, body, user);

      expect(result).toEqual(mockResult);
      expect(service.proposerCreneau).toHaveBeenCalledWith(id, 'user123', '2026-12-01', '10:00', '12:00');
    });
  });

  describe('accepterCreneau', () => {
    it('should call accepterCreneau on service', async () => {
      const id = new Types.ObjectId().toString();
      const user = { userId: 'user123' };
      const mockResult = { _id: id };
      mockConversationsService.accepterCreneau.mockResolvedValueOnce(mockResult);

      const result = await controller.accepterCreneau(id, user);

      expect(result).toEqual(mockResult);
      expect(service.accepterCreneau).toHaveBeenCalledWith(id, 'user123');
    });
  });

  describe('refuserCreneau', () => {
    it('should call refuserCreneau on service', async () => {
      const id = new Types.ObjectId().toString();
      const user = { userId: 'user123' };
      const mockResult = { _id: id };
      mockConversationsService.refuserCreneau.mockResolvedValueOnce(mockResult);

      const result = await controller.refuserCreneau(id, user);

      expect(result).toEqual(mockResult);
      expect(service.refuserCreneau).toHaveBeenCalledWith(id, 'user123');
    });
  });

  describe('annulerPrestation', () => {
    it('should call annulerPrestation on service', async () => {
      const id = new Types.ObjectId().toString();
      const user = { userId: 'user123' };
      const mockResult = { _id: id };
      mockConversationsService.annulerPrestation.mockResolvedValueOnce(mockResult);

      const result = await controller.annulerPrestation(id, user);

      expect(result).toEqual(mockResult);
      expect(service.annulerPrestation).toHaveBeenCalledWith(id, 'user123');
    });
  });
});
