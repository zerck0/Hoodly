import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PostsService } from './posts.service';
import { Post } from './schemas/post.schema';
import { Comment } from './schemas/comment.schema';
import { UsersService } from '../users/services/users.service';
import { UploadsService } from '../uploads/services/uploads.service';
import { PostType } from './enums/post-type.enum';
import { NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let usersService: UsersService;
  let uploadsService: UploadsService;

  let mockPostModel: any;
  let mockCommentModel: any;

  let mockPostDoc: any;
  let mockCommentDoc: any;
  let mockUser: any;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockUploadsService = {
    uploadFile: jest.fn(),
  };

  // Helper valid IDs to prevent BSONError
  const validPostId = new Types.ObjectId();
  const validCommentId = new Types.ObjectId();
  const validUserId = new Types.ObjectId();
  const validZoneId = new Types.ObjectId();
  const validCursor = new Types.ObjectId();

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUser = {
      _id: validUserId,
      name: 'John Doe',
      picture: 'avatar.png',
    };

    mockPostDoc = {
      _id: validPostId,
      author: mockUser._id,
      zone: validZoneId,
      content: 'This is a post content',
      media: [],
      type: PostType.DISCUSSION,
      likes: [],
      commentCount: 0,
      isPinned: false,
      deletedAt: null,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockCommentDoc = {
      _id: validCommentId,
      post: mockPostDoc._id,
      author: mockUser._id,
      content: 'This is a comment',
      deletedAt: null,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    // Constructors
    mockPostModel = jest.fn().mockImplementation((dto) => {
      return {
        ...dto,
        _id: new Types.ObjectId(),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
    });

    mockCommentModel = jest.fn().mockImplementation((dto) => {
      return {
        ...dto,
        _id: new Types.ObjectId(),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
    });

    // Static Methods - Post
    mockPostModel.findById = jest.fn().mockResolvedValue(mockPostDoc);
    mockPostModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockPostDoc),
    });
    mockPostModel.findOne = jest.fn().mockResolvedValue(mockPostDoc);

    const postFindChain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockPostDoc]),
    };
    mockPostModel.find = jest.fn().mockReturnValue(postFindChain);

    // Static Methods - Comment
    mockCommentModel.findByIdAndUpdate = jest
      .fn()
      .mockResolvedValue(mockCommentDoc);
    mockCommentModel.findOne = jest.fn().mockResolvedValue(mockCommentDoc);

    const commentFindChain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockCommentDoc]),
    };
    mockCommentModel.find = jest.fn().mockReturnValue(commentFindChain);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getModelToken(Post.name), useValue: mockPostModel },
        { provide: getModelToken(Comment.name), useValue: mockCommentModel },
        { provide: UsersService, useValue: mockUsersService },
        { provide: UploadsService, useValue: mockUploadsService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    usersService = module.get<UsersService>(UsersService);
    uploadsService = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a post successfully without files', async () => {
      mockUsersService.findById.mockResolvedValueOnce(mockUser);
      const dto = {
        content: 'Hello World',
        type: PostType.DISCUSSION,
        media: [],
      };

      const result = await service.createPost(
        validZoneId.toString(),
        validUserId.toString(),
        dto,
      );

      expect(result).toBeDefined();
      expect(mockUsersService.findById).toHaveBeenCalledWith(
        validUserId.toString(),
      );
      expect(uploadsService.uploadFile).not.toHaveBeenCalled();
    });

    it('should create a post and upload files if provided', async () => {
      mockUsersService.findById.mockResolvedValueOnce(mockUser);
      mockUploadsService.uploadFile.mockResolvedValueOnce(
        'http://aws.com/file1.png',
      );

      const dto = {
        content: 'Hello World',
        type: PostType.DISCUSSION,
        media: [],
      };
      const mockFiles = [{ originalname: 'file1.png' } as any];

      const result = await service.createPost(
        validZoneId.toString(),
        validUserId.toString(),
        dto,
        mockFiles,
      );

      expect(result).toBeDefined();
      expect(uploadsService.uploadFile).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValueOnce(null);

      await expect(
        service.createPost(validZoneId.toString(), validUserId.toString(), {
          content: 'Hello',
          type: PostType.DISCUSSION,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleLike', () => {
    it('should add like if user has not liked the post', async () => {
      mockPostDoc.likes = []; // empty
      const userId = new Types.ObjectId();

      const result = await service.toggleLike(
        mockPostDoc._id.toString(),
        userId.toString(),
      );

      expect(result).toBeDefined();
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPostDoc._id.toString(),
        { $addToSet: { likes: userId } },
        { new: true },
      );
    });

    it('should remove like if user has already liked the post', async () => {
      const userId = new Types.ObjectId();
      mockPostDoc.likes = [userId]; // liked

      const result = await service.toggleLike(
        mockPostDoc._id.toString(),
        userId.toString(),
      );

      expect(result).toBeDefined();
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPostDoc._id.toString(),
        { $pull: { likes: userId } },
        { new: true },
      );
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostModel.findById.mockResolvedValueOnce(null);

      await expect(
        service.toggleLike(validPostId.toString(), validUserId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getComments', () => {
    it('should return comments list with cursor', async () => {
      const result = await service.getComments(
        validPostId.toString(),
        undefined,
        20,
      );

      expect(result.data).toEqual([mockCommentDoc]);
      expect(result.nextCursor).toBeNull();
    });

    it('should include nextCursor if limits match', async () => {
      const result = await service.getComments(
        validPostId.toString(),
        validCursor.toString(),
        1,
      );

      expect(result.data).toEqual([mockCommentDoc]);
      expect(result.nextCursor).toBe(mockCommentDoc._id.toString());
    });
  });

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      const result = await service.deletePost(
        mockPostDoc._id.toString(),
        mockUser._id.toString(),
      );

      expect(result).toBeDefined();
      expect(mockPostModel.findOne).toHaveBeenCalledWith({
        _id: mockPostDoc._id,
        author: mockUser._id,
      });
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundException if post not found or unauthorized', async () => {
      mockPostModel.findOne.mockResolvedValueOnce(null);

      await expect(
        service.deletePost(validPostId.toString(), validUserId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      const result = await service.deleteComment(
        mockCommentDoc._id.toString(),
        mockUser._id.toString(),
      );

      expect(result).toEqual({ message: 'Commentaire supprimé' });
      expect(mockCommentModel.findOne).toHaveBeenCalledWith({
        _id: mockCommentDoc._id,
        author: mockUser._id,
      });
      expect(mockCommentModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment not found or unauthorized', async () => {
      mockCommentModel.findOne.mockResolvedValueOnce(null);

      await expect(
        service.deleteComment(
          validCommentId.toString(),
          validUserId.toString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    it('should add a comment successfully', async () => {
      mockUsersService.findById.mockResolvedValueOnce(mockUser);
      mockPostModel.findById.mockResolvedValueOnce(mockPostDoc);

      const result = await service.addComment(
        mockPostDoc._id.toString(),
        mockUser._id.toString(),
        { content: 'New comment content' },
      );

      expect(result).toBeDefined();
      expect(mockCommentModel).toHaveBeenCalled();
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPostDoc._id.toString(),
        { $inc: { commentCount: 1 } },
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValueOnce(null);

      await expect(
        service.addComment(validPostId.toString(), validUserId.toString(), {
          content: 'Content',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if post is not found', async () => {
      mockUsersService.findById.mockResolvedValueOnce(mockUser);
      mockPostModel.findById.mockResolvedValueOnce(null);

      await expect(
        service.addComment(validPostId.toString(), validUserId.toString(), {
          content: 'Content',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFeedByZone', () => {
    it('should return feed successfully', async () => {
      const result = await service.getFeedByZone(
        validZoneId.toString(),
        undefined,
        20,
        PostType.DISCUSSION,
      );

      expect(result.data).toEqual([mockPostDoc]);
      expect(result.nextCursor).toBeNull();
    });

    it('should return feed with nextCursor if more posts exist', async () => {
      const result = await service.getFeedByZone(
        validZoneId.toString(),
        validCursor.toString(),
        1,
      );

      expect(result.data).toEqual([mockPostDoc]);
      expect(result.nextCursor).toBe(mockPostDoc._id.toString());
    });
  });
});
