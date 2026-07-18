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
import { User, UserDocument } from '../../users/schemas/user.schema';
import { ServicesService } from '../../services/services/services.service';
import { ConversationsGateway } from '../gateways/conversations.gateway';
import { normalizeDateOnly } from '../../../shared/utils/date.util';
import { ContractsService } from '../../contracts/contracts.service';
import { DocumentsService } from '../../documents/documents.service';
import { UploadsService } from '../../uploads/services/uploads.service';
import { DocumentType } from '../../documents/schemas/document.schema';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as crypto from 'crypto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => ServicesService))
    private servicesService: ServicesService,
    @Inject(forwardRef(() => ConversationsGateway))
    private conversationsGateway: ConversationsGateway,
    private readonly contractsService: ContractsService,
    private readonly documentsService: DocumentsService,
    private readonly uploadsService: UploadsService,
  ) {}

  async createForEvent(
    eventId: string,
    createurId: string,
    eventTitre: string,
  ): Promise<ConversationDocument> {
    const conv = new this.conversationModel({
      eventId: new Types.ObjectId(eventId),
      nom: eventTitre,
      participants: [new Types.ObjectId(createurId)],
      statut: 'active',
    });
    await conv.save();
    await this.sendSystemMessage(
      conv._id.toString(),
      `🎉 Discussion de groupe créée pour l'événement "${eventTitre}". Les participants seront ajoutés automatiquement à cette discussion.`,
    );
    return conv;
  }

  async addParticipantToEvent(eventId: string, userId: string): Promise<void> {
    const conv = await this.conversationModel.findOneAndUpdate(
      { eventId: new Types.ObjectId(eventId) },
      { $addToSet: { participants: new Types.ObjectId(userId) } },
      { new: true },
    );
    if (conv) {
      const user = await this.userModel.findById(userId).lean();
      const userName = (user as any)?.name || 'Un participant';
      await this.sendSystemMessage(
        conv._id.toString(),
        `👋 ${userName} a rejoint la discussion.`,
      );
    }
  }

  async deleteByEventId(eventId: string): Promise<void> {
    await this.conversationModel.deleteOne({
      eventId: new Types.ObjectId(eventId),
    });
  }

  async removeParticipantFromEvent(
    eventId: string,
    userId: string,
  ): Promise<void> {
    const conv = await this.conversationModel.findOneAndUpdate(
      { eventId: new Types.ObjectId(eventId) },
      { $pull: { participants: new Types.ObjectId(userId) } },
      { new: true },
    );
    if (conv) {
      const user = await this.userModel.findById(userId).lean();
      const userName = (user as any)?.name || 'Un participant';
      await this.sendSystemMessage(
        conv._id.toString(),
        `👋 ${userName} a quitté la discussion.`,
      );
    }
  }

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
    content?: string,
    imageUrl?: string,
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
      imageUrl,
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
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name picture');
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

  async findByServiceId(
    serviceId: string,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findOne({
      serviceId: new Types.ObjectId(serviceId),
    });
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
      proposeurId: new Types.ObjectId(userId),
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

    if (conversation.creneau.proposeurId?.toString() === userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas accepter votre propre proposition de créneau',
      );
    }

    conversation.creneau.statut = 'confirme';

    let isPaid = false;
    if (conversation.serviceId) {
      const service = conversation.serviceId as any;
      if (!service.gratuit && service.points && service.points > 0) {
        isPaid = true;
      }
    }

    if (isPaid) {
      conversation.prestationStatut = 'aucun';
    } else {
      conversation.prestationStatut = 'valide';
    }
    await conversation.save();

    if (conversation.serviceId) {
      const service = conversation.serviceId as any;
      const serviceId = service._id.toString();
      const visitorId = conversation.participants.find(
        (p) => p._id.toString() !== service.createurId.toString(),
      );

      if (!service.gratuit && service.points && service.points > 0) {
        try {
          const existingContract =
            await this.contractsService.findActiveContractForService(serviceId);
          if (!existingContract && visitorId) {
            const isDemande = service.type === 'demande';
            const clientId = isDemande
              ? service.createurId.toString()
              : visitorId._id.toString();
            const providerId = isDemande
              ? visitorId._id.toString()
              : service.createurId.toString();

            const [clientUser, providerUser] = await Promise.all([
              this.userModel.findById(clientId),
              this.userModel.findById(providerId),
            ]);

            if (clientUser && providerUser) {
              const dateStr = new Date(
                conversation.creneau.date,
              ).toLocaleDateString('fr-FR');
              const terms =
                `CONTRAT D'ENTRAIDE DE QUARTIER\n\n` +
                `Le présent contrat est conclu entre :\n` +
                `- Client / Bénéficiaire : ${clientUser.name} (${clientUser.email})\n` +
                `- Prestataire / Intervenant : ${providerUser.name} (${providerUser.email})\n\n` +
                `OBJET DE L'ENTRAIDE :\n` +
                `Le prestataire s'engage à réaliser le service "${service.titre}" au profit du client.\n` +
                `Description : ${service.description || 'Non renseignée'}\n\n` +
                `MODALITÉS DE RÉALISATION :\n` +
                `- Date d'exécution convenue : Le ${dateStr}\n` +
                `- Créneau horaire : De ${conversation.creneau.debut} à ${conversation.creneau.fin}\n\n` +
                `VALEUR DE L'ÉCHANGE :\n` +
                `L'entraide est valorisée à un montant de ${service.points} points.\n` +
                `Ces points seront transférés du compte du client vers celui du prestataire lors de la validation finale du service.\n\n` +
                `SIGNATURES :\n` +
                `En signant ce contrat, les deux parties valident la planification et les termes ci-dessus décrits.`;

              const pdfDoc = await PDFDocument.create();
              const page = pdfDoc.addPage([595, 842]);
              const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
              const fontBold = await pdfDoc.embedFont(
                StandardFonts.HelveticaBold,
              );

              page.drawText(`CONTRAT D'ENTRAIDE - HOODLY`, {
                x: 50,
                y: 780,
                size: 18,
                font: fontBold,
                color: rgb(0.05, 0.2, 0.5),
              });

              page.drawLine({
                start: { x: 50, y: 760 },
                end: { x: 545, y: 760 },
                thickness: 1,
                color: rgb(0.8, 0.8, 0.8),
              });

              const lines = terms.split('\n');
              let yPos = 720;
              for (const line of lines) {
                const isHeader =
                  line.endsWith(':') || line.startsWith('CONTRAT');
                page.drawText(line, {
                  x: 50,
                  y: yPos,
                  size: isHeader ? 10 : 9,
                  font: isHeader ? fontBold : font,
                  color: isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.3, 0.3, 0.3),
                });
                yPos -= 15;
              }

              page.drawText(`Prestataire (Signez ci-dessous)`, {
                x: 80,
                y: 145,
                size: 9,
                font: fontBold,
              });
              page.drawRectangle({
                x: 80,
                y: 70,
                width: 160,
                height: 60,
                borderColor: rgb(0.8, 0.8, 0.8),
                borderWidth: 1,
              });

              page.drawText(`Client (Signez ci-dessous)`, {
                x: 355,
                y: 145,
                size: 9,
                font: fontBold,
              });
              page.drawRectangle({
                x: 355,
                y: 70,
                width: 160,
                height: 60,
                borderColor: rgb(0.8, 0.8, 0.8),
                borderWidth: 1,
              });

              const pdfBytes = await pdfDoc.save();
              const pdfBuffer = Buffer.from(pdfBytes);

              const fileUrl = await this.uploadsService.uploadFile({
                fieldname: 'file',
                originalname: `contrat_service_${serviceId}.pdf`,
                encoding: '7bit',
                mimetype: 'application/pdf',
                size: pdfBuffer.length,
                buffer: pdfBuffer,
              });

              const pdfHash = crypto
                .createHash('sha256')
                .update(pdfBuffer)
                .digest('hex');

              const doc = await this.documentsService.create({
                ownerId: clientId,
                title: `Modèle Contrat - ${service.titre}`,
                fileUrl,
                pdfHash,
                type: DocumentType.CONTRACT_TEMPLATE,
              });

              await this.contractsService.create({
                clientId,
                providerId,
                serviceId,
                title: `Contrat d'entraide - ${service.titre}`,
                terms,
                pricePoints: service.points,
                templateDocumentId: doc._id.toString(),
                signatureZones: [
                  {
                    page: 1,
                    x: 80,
                    y: 712,
                    width: 160,
                    height: 60,
                    assignee: 'provider',
                  },
                  {
                    page: 1,
                    x: 355,
                    y: 712,
                    width: 160,
                    height: 60,
                    assignee: 'client',
                  },
                ],
              });

              await this.sendSystemMessage(
                conversation._id.toString(),
                `📄 Un contrat d'entraide payant a été généré automatiquement pour ce service. Vous pouvez dès à présent le consulter et le signer depuis votre espace Contrats.`,
              );
            }
          }
        } catch (err) {
          console.error(
            '[ConversationsService] Erreur lors de la création du contrat pour service payant:',
            err,
          );
        }
      }

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

    if (!isPaid) {
      const dateStr = new Date(conversation.creneau.date).toLocaleDateString(
        'fr-FR',
      );
      await this.sendSystemMessage(
        conversation._id.toString(),
        `🎉 Rendez-vous confirmé ! La prestation est planifiée pour le ${dateStr} de ${conversation.creneau.debut} à ${conversation.creneau.fin}.`,
      );
    }

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

  async annulerPrestation(
    id: string,
    userId: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.conversationModel
      .findById(id)
      .populate('serviceId');

    if (!conversation) {
      throw new NotFoundException('Discussion introuvable');
    }

    const service = conversation.serviceId as any;
    if (service && service.contractId) {
      await this.contractsService.cancel(service.contractId.toString(), userId);
      return (await this.conversationModel.findById(id).populate('serviceId'))!;
    }

    const user = await this.userModel.findById(userId).lean();
    const userName = (user as any)?.name || 'Un voisin';

    if (service) {
      await this.servicesService.refuser(service._id.toString(), userId);
    } else {
      conversation.prestationStatut = 'refuse';
      if (conversation.creneau) {
        conversation.creneau.statut = 'annule';
      }
      await conversation.save();
    }

    await this.sendSystemMessage(
      conversation._id.toString(),
      `❌ L'entraide a été annulée par ${userName}.`,
    );

    return (await this.conversationModel.findById(id).populate('serviceId'))!;
  }
}
