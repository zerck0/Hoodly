import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@UseGuards(JwtGuard, ThrottlerGuard)
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('zones/:zoneId/posts')
  async getFeed(@Param('zoneId') zoneId: string, @Query() query: GetFeedDto) {
    return this.postsService.getFeedByZone(
      zoneId,
      query.cursor,
      query.limit,
      query.type,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('zones/:zoneId/posts')
  @UseInterceptors(FilesInterceptor('files', 5))
  async createPost(
    @Param('zoneId') zoneId: string,
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: any,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    return this.postsService.createPost(
      zoneId,
      user.userId,
      createPostDto,
      files,
    );
  }

  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post('posts/:postId/like')
  async toggleLike(@Param('postId') postId: string, @CurrentUser() user: any) {
    return this.postsService.toggleLike(postId, user.userId);
  }

  @Get('posts/:postId/comments')
  async getComments(
    @Param('postId') postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.postsService.getComments(
      postId,
      cursor,
      limit ? Number(limit) : 20,
    );
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('posts/:postId/comments')
  async addComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.postsService.addComment(postId, user.userId, createCommentDto);
  }

  @Delete('posts/:postId')
  async deletePost(@Param('postId') postId: string, @CurrentUser() user: any) {
    return this.postsService.deletePost(postId, user.userId);
  }

  @Delete('comments/:commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.deleteComment(commentId, user.userId);
  }
}
