import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';
import { VerifiedGuard } from '../../core/auth/guards/verified.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PostType } from './enums/post-type.enum';

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  const mockPostsService = {
    getFeedByZone: jest.fn(),
    createPost: jest.fn(),
    toggleLike: jest.fn(),
    getComments: jest.fn(),
    addComment: jest.fn(),
    deletePost: jest.fn(),
    deleteComment: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(VerifiedGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFeed', () => {
    it('should call service.getFeedByZone', async () => {
      mockPostsService.getFeedByZone.mockResolvedValueOnce({ data: [] });
      const query = { cursor: 'cursor', limit: 10, type: PostType.DISCUSSION };

      const result = await controller.getFeed('zone-id', query);

      expect(result).toEqual({ data: [] });
      expect(mockPostsService.getFeedByZone).toHaveBeenCalledWith(
        'zone-id',
        'cursor',
        10,
        PostType.DISCUSSION,
      );
    });
  });

  describe('createPost', () => {
    it('should call service.createPost', async () => {
      const user = { userId: 'user-id' };
      const dto = { content: 'Content', type: PostType.DISCUSSION };
      const files: any[] = [];
      mockPostsService.createPost.mockResolvedValueOnce({ _id: 'post-id' });

      const result = await controller.createPost('zone-id', dto, user, files);

      expect(result).toEqual({ _id: 'post-id' });
      expect(mockPostsService.createPost).toHaveBeenCalledWith(
        'zone-id',
        'user-id',
        dto,
        files,
      );
    });
  });

  describe('toggleLike', () => {
    it('should call service.toggleLike', async () => {
      const user = { userId: 'user-id' };
      mockPostsService.toggleLike.mockResolvedValueOnce({ likes: [] });

      const result = await controller.toggleLike('post-id', user);

      expect(result).toEqual({ likes: [] });
      expect(mockPostsService.toggleLike).toHaveBeenCalledWith(
        'post-id',
        'user-id',
      );
    });
  });

  describe('getComments', () => {
    it('should call service.getComments', async () => {
      mockPostsService.getComments.mockResolvedValueOnce({ data: [] });

      const result = await controller.getComments('post-id', 'cursor', 10);

      expect(result).toEqual({ data: [] });
      expect(mockPostsService.getComments).toHaveBeenCalledWith(
        'post-id',
        'cursor',
        10,
      );
    });

    it('should call service.getComments with default limit if not provided', async () => {
      mockPostsService.getComments.mockResolvedValueOnce({ data: [] });

      const result = await controller.getComments(
        'post-id',
        'cursor',
        undefined,
      );

      expect(result).toEqual({ data: [] });
      expect(mockPostsService.getComments).toHaveBeenCalledWith(
        'post-id',
        'cursor',
        20,
      );
    });
  });

  describe('addComment', () => {
    it('should call service.addComment', async () => {
      const user = { userId: 'user-id' };
      const dto = { content: 'Nice!' };
      mockPostsService.addComment.mockResolvedValueOnce({ _id: 'comment-id' });

      const result = await controller.addComment('post-id', dto, user);

      expect(result).toEqual({ _id: 'comment-id' });
      expect(mockPostsService.addComment).toHaveBeenCalledWith(
        'post-id',
        'user-id',
        dto,
      );
    });
  });

  describe('deletePost', () => {
    it('should call service.deletePost', async () => {
      const user = { userId: 'user-id' };
      mockPostsService.deletePost.mockResolvedValueOnce({
        deletedAt: new Date(),
      });

      const result = await controller.deletePost('post-id', user);

      expect(result).toBeDefined();
      expect(mockPostsService.deletePost).toHaveBeenCalledWith(
        'post-id',
        'user-id',
      );
    });
  });

  describe('deleteComment', () => {
    it('should call service.deleteComment', async () => {
      const user = { userId: 'user-id' };
      mockPostsService.deleteComment.mockResolvedValueOnce({
        message: 'Deleted',
      });

      const result = await controller.deleteComment('comment-id', user);

      expect(result).toEqual({ message: 'Deleted' });
      expect(mockPostsService.deleteComment).toHaveBeenCalledWith(
        'comment-id',
        'user-id',
      );
    });
  });
});
