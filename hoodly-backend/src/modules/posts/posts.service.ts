import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { PostType } from './enums/post-type.enum';
import { CreatePostDto } from './dto/create-post.dto';
import { UsersService } from '../users/services/users.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UploadsService } from '../uploads/services/uploads.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    private readonly usersService: UsersService,
    private readonly uploadsService: UploadsService,
  ) {}

  async createPost(
    zoneId: string,
    userId: string,
    dto: CreatePostDto,
    files?: Express.Multer.File[],
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    let mediaUrls: string[] = dto.media || [];

    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        this.uploadsService.uploadFile(file as any),
      );
      const uploadedUrls = await Promise.all(uploadPromises);
      mediaUrls = [...mediaUrls, ...uploadedUrls];
    }

    const newPost = new this.postModel({
      ...dto,
      media: mediaUrls,
      author: new Types.ObjectId(userId),
      zone: new Types.ObjectId(zoneId),
      authorSnapshot: {
        nom: user.name,
        avatar: user.picture,
      },
    });

    return newPost.save();
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post introuvable');

    const userObjectId = new Types.ObjectId(userId);
    const hasLiked = post.likes.some((id) => id.equals(userObjectId));

    if (hasLiked) {
      return this.postModel
        .findByIdAndUpdate(
          postId,
          { $pull: { likes: userObjectId } },
          { new: true },
        )
        .lean();
    } else {
      return this.postModel
        .findByIdAndUpdate(
          postId,
          { $addToSet: { likes: userObjectId } },
          { new: true },
        )
        .lean();
    }
  }

  async getComments(postId: string, cursor?: string, limit: number = 20) {
    const query: any = {
      post: new Types.ObjectId(postId),
      deletedAt: null,
    };

    if (cursor) {
      query._id = { $gt: new Types.ObjectId(cursor) };
    }

    const comments = await this.commentModel
      .find(query)
      .sort({ _id: 1 })
      .limit(limit)
      .lean()
      .exec();

    const hasMore = comments.length === limit;
    const nextCursor = hasMore
      ? comments[comments.length - 1]._id.toString()
      : null;

    return {
      data: comments,
      nextCursor,
    };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.postModel.findOne({
      _id: new Types.ObjectId(postId),
      author: new Types.ObjectId(userId),
    });
    if (!post)
      throw new NotFoundException('Post introuvable ou action non autorisée');

    return this.postModel
      .findByIdAndUpdate(
        postId,
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .lean();
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentModel.findOne({
      _id: new Types.ObjectId(commentId),
      author: new Types.ObjectId(userId),
    });
    if (!comment)
      throw new NotFoundException(
        'Commentaire introuvable ou action non autorisée',
      );

    await Promise.all([
      this.commentModel.findByIdAndUpdate(commentId, {
        $set: { deletedAt: new Date() },
      }),
      this.postModel.findByIdAndUpdate(comment.post, {
        $inc: { commentCount: -1 },
      }),
    ]);

    return { message: 'Commentaire supprimé' };
  }

  async addComment(postId: string, userId: string, dto: CreateCommentDto) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post introuvable');

    const newComment = new this.commentModel({
      ...dto,
      post: new Types.ObjectId(postId),
      author: new Types.ObjectId(userId),
      authorSnapshot: {
        nom: user.name,
        avatar: user.picture,
      },
    });

    const [comment] = await Promise.all([
      newComment.save(),
      this.postModel.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } }),
    ]);

    return comment;
  }

  async getFeedByZone(
    zoneId: string,
    cursor?: string,
    limit: number = 20,
    type?: PostType,
  ) {
    const query: any = {
      zone: new Types.ObjectId(zoneId),
      deletedAt: null,
    };

    if (type) {
      query.type = type;
    }

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const posts = await this.postModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .lean()
      .exec();

    const hasMore = posts.length === limit;
    const nextCursor = hasMore ? posts[posts.length - 1]._id.toString() : null;

    return {
      data: posts,
      nextCursor,
    };
  }
}
