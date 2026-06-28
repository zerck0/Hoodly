import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import * as express from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { DocumentStatus } from './schemas/document.schema';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { UploadsService } from '../uploads/services/uploads.service';
import { QueryParserService } from './parser/query-parser.service';

interface AuthenticatedUser {
  userId: string;
  role: string;
  [key: string]: unknown;
}

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('documents')
@UseGuards(RolesGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly uploadsService: UploadsService,
    private readonly queryParserService: QueryParserService,
  ) {}

  @Post('query')
  @ApiOperation({
    summary: 'Requêter les documents via le langage maison (Lex/Yacc)',
  })
  @ApiResponse({ status: 200, description: 'Résultats filtrés' })
  async query(
    @Body() body: QueryDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const filter = this.queryParserService.parse(body.query);

    if (user.role !== 'admin') {
      filter.ownerId = user.userId;
    }

    return this.documentsService.findWithFilter(filter);
  }

  @Post()
  @ApiOperation({ summary: 'Enregistrer les métadonnées d’un document' })
  @ApiResponse({ status: 201, description: 'Document enregistré avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (createDocumentDto.ownerId !== user.userId && user.role !== 'admin') {
      throw new ForbiddenException(
        'Vous ne pouvez pas créer un document pour un autre utilisateur',
      );
    }
    return this.documentsService.create(createDocumentDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Récupérer mes documents' })
  @ApiResponse({
    status: 200,
    description: 'Liste des documents de l’utilisateur',
  })
  async findMyDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.findByOwner(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d’un document' })
  @ApiResponse({ status: 200, description: 'Détails du document' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Document introuvable' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const doc = await this.documentsService.findById(id);
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }

    if (doc.ownerId.toString() !== user.userId && user.role !== 'admin') {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation d'accéder à ce document",
      );
    }
    return doc;
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Télécharger le contenu PDF brut d’un document' })
  async getPdfContent(@Param('id') id: string, @Res() res: express.Response) {
    const doc = await this.documentsService.findById(id);
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }

    try {
      const buffer = await this.uploadsService.downloadFile(doc.fileUrl);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${doc.title}.pdf"`,
      );
      res.send(buffer);
    } catch (err: any) {
      throw new NotFoundException(
        `Fichier PDF introuvable sur le stockage distant : ${err.message}`,
      );
    }
  }

  @Patch(':id/status')
  @Roles('admin' as any)
  @ApiOperation({
    summary: 'Mettre à jour le statut d’un document (Admin uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Document introuvable' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: DocumentStatus,
  ) {
    return this.documentsService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un document' })
  @ApiResponse({ status: 200, description: 'Document supprimé' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Document introuvable' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const doc = await this.documentsService.findById(id);
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }

    if (doc.ownerId.toString() !== user.userId && user.role !== 'admin') {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de supprimer ce document",
      );
    }
    await this.documentsService.remove(id);
    return { message: 'Document supprimé avec succès' };
  }
}
