import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ConversationsService } from '../services/conversations.service';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { VerifiedGuard } from '../../../core/auth/guards/verified.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { MongoIdValidationPipe } from '../../../shared/pipes/mongo-id-validation.pipe';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ProposeCreneauDto } from '../dto/propose-creneau.dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtGuard, VerifiedGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Démarrer ou récupérer une conversation pour un service',
  })
  @ApiResponse({ status: 201, description: 'Conversation initialisée' })
  async create(
    @Body() body: CreateConversationDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.getOrCreate(
      body.serviceId,
      user.userId,
      body.destinataireId,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Lister toutes mes conversations' })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  async findMe(@CurrentUser() user: { userId: string }) {
    return this.conversationsService.getUserConversations(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer les détails d'une conversation" })
  @ApiResponse({ status: 200, description: 'Détails de la conversation' })
  async findOne(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.findOne(id, user.userId);
  }

  @Get(':id/messages')
  @ApiOperation({
    summary: "Récupérer l'historique des messages d'une conversation",
  })
  @ApiResponse({ status: 200, description: 'Historique des messages' })
  async getMessages(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.getMessages(id, user.userId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Envoyer un message dans une conversation' })
  @ApiResponse({ status: 201, description: 'Message envoyé' })
  async sendMessage(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: SendMessageDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.sendMessage(id, user.userId, body.content);
  }

  @Patch(':id/messages/:messageId')
  @ApiOperation({ summary: 'Modifier un message dans une conversation' })
  @ApiResponse({ status: 200, description: 'Message modified avec succès' })
  editMessage(
    @Param('id', MongoIdValidationPipe) id: string,
    @Param('messageId', MongoIdValidationPipe) messageId: string,
    @Body() body: SendMessageDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.editMessage(
      id,
      messageId,
      user.userId,
      body.content,
    );
  }

  @Delete(':id/messages/:messageId')
  @ApiOperation({ summary: 'Supprimer un message dans une conversation' })
  @ApiResponse({ status: 200, description: 'Message supprimé avec succès' })
  deleteMessage(
    @Param('id', MongoIdValidationPipe) id: string,
    @Param('messageId', MongoIdValidationPipe) messageId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.deleteMessage(id, messageId, user.userId);
  }

  @Patch(':id/creneau/proposer')
  @ApiOperation({
    summary: 'Proposer un créneau de rendez-vous pour la prestation',
  })
  @ApiResponse({ status: 200, description: 'Créneau proposé avec succès' })
  async proposerCreneau(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: ProposeCreneauDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.proposerCreneau(
      id,
      user.userId,
      body.date,
      body.debut,
      body.fin,
    );
  }

  @Patch(':id/creneau/accepter')
  @ApiOperation({ summary: 'Accepter le créneau de rendez-vous proposé' })
  @ApiResponse({
    status: 200,
    description: 'Créneau validé et rendez-vous planifié',
  })
  async accepterCreneau(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.accepterCreneau(id, user.userId);
  }

  @Patch(':id/creneau/refuser')
  @ApiOperation({ summary: 'Décliner le créneau de rendez-vous proposé' })
  @ApiResponse({ status: 200, description: 'Créneau refusé' })
  async refuserCreneau(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.refuserCreneau(id, user.userId);
  }

  @Patch(':id/annuler')
  @ApiOperation({ summary: "Annuler la prestation / l'entraide" })
  @ApiResponse({ status: 200, description: 'Prestation annulée avec succès' })
  async annulerPrestation(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.annulerPrestation(id, user.userId);
  }
}
