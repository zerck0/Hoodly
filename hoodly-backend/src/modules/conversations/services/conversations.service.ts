/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from '../schemas/conversation.schema';
import { Message, MessageDocument } from '../schemas/message.schema';
import { ServicesService } from '../../services/services/services.service';
import { ConversationsGateway } from '../gateways/conversations.gateway';
import { normalizeDateOnly } from '../../../shared/utils/date.util';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @Inject(forwardRef(() => ServicesService))
    private servicesService: ServicesService,
    @Inject(forwardRef(() => ConversationsGateway))
    private conversationsGateway: ConversationsGateway,
  ) {}

  async getOrCreate(
    serviceId: string | undefined,
    visitorId: string,
    creatorId: string,
  ): Promise<ConversationDocument> {
    if (visitorId === creatorId) {
      throw new BadRequestException(
        'Vous ne pouvez pas démarrer une discussion avec vous-même',
      );
    }

    const participants = [
      new Types.ObjectId(visitorId),
      new Types.ObjectId(creatorId),
    ].sort();

    const query: any = { participants: { $all: participants } };
    if (serviceId) {
      query.serviceId = new Types.ObjectId(serviceId);
    } else {
      query.serviceId = { $exists: false };
    }

    let conversation = await this.conversationModel.findOne(query);

    if (!conversation) {
      conversation = new this.conversationModel({
        ...(serviceId && { serviceId: new Types.ObjectId(serviceId) }),
        participants,
        statut: 'active',
      });
      await conversation.save();

      await this.sendSystemMessage(
        conversation._id.toString(),
        serviceId
          ? "👋 Nouvelle discussion lancée au sujet de cette annonce d'entraide. C'est le moment d'échanger et de caler vos rendez-vous !"
          : '👋 Bonjour ! Discussion générale démarrée entre voisins. Rapprochons notre quartier !',
      );
    }

    return conversation;
  }

  async findOne(id: string, userId: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel
      .findById(id)
      .populate('serviceId')
      .populate('participants', 'name email picture points');

    if (!conversation) {
      throw new NotFoundException('Discussion introuvable');
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p._id.toString() === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Non autorisé à consulter cette discussion');
    }

    return conversation;
  }

  async getUserConversations(userId: string): Promise<ConversationDocument[]> {
    return this.conversationModel
      .find({
        participants: new Types.ObjectId(userId),
      })
      .populate({
        path: 'serviceId',
        populate: { path: 'createurId', select: 'name email picture' },
      })
      .populate('participants', 'name email picture')
      .sort({ updatedAt: -1 });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<MessageDocument> {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Discussion introuvable');
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === senderId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'Non autorisé à envoyer un message dans cette discussion',
      );
    }

    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      content,
      system: false,
    });

    const saved = await message.save();

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { updatedAt: new Date() },
    });

    try {
      this.conversationsGateway.emitNewMessage(conversationId, saved);
    } catch (e) {
      console.warn('[WS] Failed to emit message:', e);
    }

    return saved;
  }

  async editMessage(
    conversationId: string,
    messageId: string,
    senderId: string,
    newContent: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    if (message.senderId?.toString() !== senderId) {
      throw new ForbiddenException(
        "Non autorisé à modifier ce message car vous n'en êtes pas l'auteur",
      );
    }

    if (message.conversationId.toString() !== conversationId) {
      throw new BadRequestException(
        "Le message n'appartient pas à cette conversation",
      );
    }

    message.content = newContent;
    message.edited = true;
    const saved = await message.save();

    try {
      this.conversationsGateway.emitMessageUpdated(conversationId, saved);
    } catch (e) {
      console.warn('[WS] Failed to emit message update:', e);
    }

    return saved;
  }

  async deleteMessage(
    conversationId: string,
    messageId: string,
    senderId: string,
  ): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    if (message.senderId?.toString() !== senderId) {
      throw new ForbiddenException(
        "Non autorisé à supprimer ce message car vous n'en êtes pas l'auteur",
      );
    }

    if (message.conversationId.toString() !== conversationId) {
      throw new BadRequestException(
        "Le message n'appartient pas à cette conversation",
      );
    }

    await this.messageModel.findByIdAndDelete(messageId);

    try {
      this.conversationsGateway.emitMessageDeleted(conversationId, messageId);
    } catch (e) {
      console.warn('[WS] Failed to emit message delete:', e);
    }
  }

  async sendSystemMessage(
    conversationId: string,
    content: string,
  ): Promise<MessageDocument> {
    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      content,
      system: true,
    });

    const saved = await message.save();
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { updatedAt: new Date() },
    });

    try {
      this.conversationsGateway.emitNewMessage(conversationId, saved);
    } catch (e) {
      console.warn('[WS] Failed to emit system message:', e);
    }

    return saved;
  }

  async getMessages(
    conversationId: string,
    userId: string,
  ): Promise<MessageDocument[]> {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Discussion introuvable');
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Non autorisé à consulter les messages');
    }

    return this.messageModel
      .find({
        conversationId: new Types.ObjectId(conversationId),
      })
      .sort({ createdAt: 1 });
  }

  async rejectOtherCandidates(
    serviceId: string,
    acceptedResponderId: string,
  ): Promise<void> {
    const otherConversations = await this.conversationModel.find({
      serviceId: new Types.ObjectId(serviceId),
      participants: { $ne: new Types.ObjectId(acceptedResponderId) },
    });

    for (const conv of otherConversations) {
      conv.prestationStatut = 'refuse';
      await conv.save();
      await this.sendSystemMessage(
        conv._id.toString(),
        "Merci beaucoup d'avoir proposé votre aide ! J'ai trouvé un arrangement avec un autre voisin pour ce créneau. Au plaisir de s'entraider une prochaine fois !",
      );
    }
  }

  async updatePrestationStatus(
    conversationId: string,
    prestationStatut: 'aucun' | 'valide' | 'en_cours' | 'termine' | 'refuse',
    realisationValidee?: boolean,
  ): Promise<ConversationDocument> {
    const updateObj: any = { prestationStatut };
    if (realisationValidee !== undefined) {
      updateObj.realisationValidee = realisationValidee;
    }
    const updated = await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { $set: updateObj },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Discussion introuvable');
    return updated;
  }

  async proposerCreneau(
    id: string,
    userId: string,
    date: string,
    debut: string,
    fin: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(id, userId);

    let providerId: string = '';
    const service = conversation.serviceId as any;
    if (service) {
      const isCreator =
        typeof service.createurId === 'object'
          ? (service.createurId._id || service.createurId).toString()
          : service.createurId.toString();

      const visitor = conversation.participants.find(
        (p) => p._id.toString() !== isCreator,
      );
      const visitorId = visitor ? visitor._id.toString() : '';

      providerId = service.type === 'demande' ? visitorId : isCreator;
    }

    if (providerId) {
      const providerConvs = await this.conversationModel
        .find({
          participants: new Types.ObjectId(providerId),
          _id: { $ne: conversation._id },
          'creneau.statut': { $in: ['en_attente', 'confirme'] },
        })
        .populate('serviceId');

      const propDateStr = normalizeDateOnly(date);

      for (const pc of providerConvs) {
        if (pc.creneau && pc.creneau.date) {
          const pcDateStr = normalizeDateOnly(pc.creneau.date);

          if (pcDateStr === propDateStr) {
            const start1 = debut;
            const end1 = fin;
            const start2 = pc.creneau.debut;
            const end2 = pc.creneau.fin;

            if (start1 < end2 && start2 < end1) {
              throw new BadRequestException(
                'Ce créneau horaire chevauche un rendez-vous déjà réservé ou proposé avec ce voisin.',
              );
            }
          }
        }
      }
    }

    const propDateStr = normalizeDateOnly(date);
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    if (propDateStr === todayStr) {
      const [propHours, propMins] = debut.split(':').map(Number);
      const curHours = today.getHours();
      const curMins = today.getMinutes();
      if (
        propHours < curHours ||
        (propHours === curHours && propMins <= curMins)
      ) {
        throw new BadRequestException(
          "L'horaire de début choisi est déjà passé pour aujourd'hui.",
        );
      }
    }

    conversation.creneau = {
      date: new Date(date),
      debut,
      fin,
      statut: 'en_attente',
    };

    await conversation.save();

    const dateStr = new Date(date).toLocaleDateString('fr-FR');
    await this.sendSystemMessage(
      conversation._id.toString(),
      `📅 Proposition de rendez-vous envoyée pour le ${dateStr} de ${debut} à ${fin}. En attente de confirmation...`,
    );

    return conversation;
  }

  async accepterCreneau(
    id: string,
    userId: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(id, userId);
    if (!conversation.creneau) {
      throw new BadRequestException(
        'Aucun créneau proposé dans cette discussion',
      );
    }
    if (conversation.creneau.statut !== 'en_attente') {
      throw new BadRequestException(
        "Ce créneau n'est pas en attente de validation",
      );
    }

    conversation.creneau.statut = 'confirme';
    conversation.prestationStatut = 'valide';
    await conversation.save();

    if (conversation.serviceId) {
      const service = conversation.serviceId as any;
      const serviceId = service._id.toString();
      const visitorId = conversation.participants.find(
        (p) => p._id.toString() !== service.createurId.toString(),
      );

      if (service.type === 'demande') {
        try {
          if (visitorId) {
            await this.servicesService.accepter(
              serviceId,
              visitorId._id.toString(),
            );
          }
        } catch (e) {
          console.warn('Could not run global accepter logic for demande:', e);
        }
      }
    }

    const dateStr = new Date(conversation.creneau.date).toLocaleDateString(
      'fr-FR',
    );
    await this.sendSystemMessage(
      conversation._id.toString(),
      `🎉 Rendez-vous confirmé ! La prestation est planifiée pour le ${dateStr} de ${conversation.creneau.debut} à ${conversation.creneau.fin}.`,
    );

    return conversation;
  }

  async refuserCreneau(
    id: string,
    userId: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(id, userId);
    if (!conversation.creneau) {
      throw new BadRequestException(
        'Aucun créneau proposé dans cette discussion',
      );
    }

    const oldDebut = conversation.creneau.debut;
    const oldFin = conversation.creneau.fin;

    conversation.creneau.statut = 'annule';
    conversation.prestationStatut = 'aucun';
    await conversation.save();

    await this.sendSystemMessage(
      conversation._id.toString(),
      `❌ La proposition de rendez-vous de ${oldDebut} à ${oldFin} a été déclinée. N'hésitez pas à suggérer un autre horaire !`,
    );

    return conversation;
  }
}
