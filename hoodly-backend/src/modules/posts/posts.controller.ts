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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';
import { VerifiedGuard } from '../../core/auth/guards/verified.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtGuard, ThrottlerGuard)
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('zones/:zoneId/posts')
  @ApiOperation({ summary: "Récupérer le flux de publications d'une zone" })
  @ApiParam({ name: 'zoneId', description: 'ID de la zone' })
  @ApiResponse({ status: 200, description: 'Flux récupéré avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
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
  @UseGuards(VerifiedGuard)
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Créer une publication dans une zone' })
  @ApiParam({ name: 'zoneId', description: 'ID de la zone' })
  @ApiResponse({ status: 201, description: 'Publication créée avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Format de fichier ou données invalides',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
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
  @UseGuards(VerifiedGuard)
  @ApiOperation({ summary: "Liker ou retirer le like d'une publication" })
  @ApiParam({ name: 'postId', description: 'ID de la publication' })
  @ApiResponse({ status: 200, description: 'Statut du like modifié' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Publication non trouvée' })
  async toggleLike(@Param('postId') postId: string, @CurrentUser() user: any) {
    return this.postsService.toggleLike(postId, user.userId);
  }

  @Get('posts/:postId/comments')
  @ApiOperation({ summary: "Récupérer les commentaires d'une publication" })
  @ApiParam({ name: 'postId', description: 'ID de la publication' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Curseur pour la pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de commentaires à retourner',
  })
  @ApiResponse({
    status: 200,
    description: 'Commentaires récupérés avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Publication non trouvée' })
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
  @UseGuards(VerifiedGuard)
  @ApiOperation({ summary: 'Ajouter un commentaire à une publication' })
  @ApiParam({ name: 'postId', description: 'ID de la publication' })
  @ApiResponse({ status: 201, description: 'Commentaire ajouté avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Publication non trouvée' })
  async addComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.postsService.addComment(postId, user.userId, createCommentDto);
  }

  @Delete('posts/:postId')
  @UseGuards(VerifiedGuard)
  @ApiOperation({ summary: 'Supprimer une publication' })
  @ApiParam({ name: 'postId', description: 'ID de la publication' })
  @ApiResponse({
    status: 200,
    description: 'Publication supprimée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Action non autorisée' })
  @ApiResponse({ status: 404, description: 'Publication non trouvée' })
  async deletePost(@Param('postId') postId: string, @CurrentUser() user: any) {
    return this.postsService.deletePost(postId, user.userId);
  }

  @Delete('comments/:commentId')
  @UseGuards(VerifiedGuard)
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  @ApiParam({ name: 'commentId', description: 'ID du commentaire' })
  @ApiResponse({ status: 200, description: 'Commentaire supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Action non autorisée' })
  @ApiResponse({ status: 404, description: 'Commentaire non trouvé' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.deleteComment(commentId, user.userId);
  }
}
