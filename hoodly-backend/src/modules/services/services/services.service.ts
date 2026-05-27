import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
  ServiceType,
} from '../schemas/service.schema';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ConversationsService } from '../../conversations/services/conversations.service';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { TransactionType } from '../../transactions/schemas/transaction.schema';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => ConversationsService))
    private conversationsService: ConversationsService,
    private transactionsService: TransactionsService,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
    createurId: string,
  ): Promise<Service> {
    try {
      const newService = new this.serviceModel({
        ...createServiceDto,
        createurId,
      });
      return await newService.save();
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la création du service',
      );
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    type?: string,
    statut?: string,
    categorie?: string,
    zoneId?: string,
  ) {
    const query = this.buildSearchQuery(
      search,
      type,
      statut,
      categorie,
      zoneId,
    );
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      this.serviceModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('createurId', 'name email picture')
        .populate('responderId', 'name email picture')
        .populate('zoneId', 'nom ville')
        .lean(),
      this.serviceModel.countDocuments(query),
    ]);

    return {
      services,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ServiceDocument> {
    const service = await this.serviceModel
      .findById(id)
      .populate('createurId', 'name email picture')
      .populate('responderId', 'name email picture')
      .populate('zoneId', 'nom ville');
    if (!service) throw new NotFoundException('Service introuvable');
    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    userId: string,
    role: string,
  ): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service introuvable');

    if (service.createurId.toString() !== userId && role !== 'admin') {
      throw new ForbiddenException('Non autorisé');
    }

    const updated = await this.serviceModel.findByIdAndUpdate(
      id,
      { $set: updateServiceDto },
      { returnDocument: 'after' },
    );
    return updated!;
  }

  async delete(id: string, userId: string, role: string) {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service introuvable');

    if (service.createurId.toString() !== userId && role !== 'admin') {
      throw new ForbiddenException('Non autorisé');
    }

    await this.serviceModel.findByIdAndDelete(id);
    return { message: 'Service supprimé' };
  }

  private buildSearchQuery(
    search?: string,
    type?: string,
    statut?: string,
    categorie?: string,
    zoneId?: string,
  ) {
    const query: Record<string, any> = {};

    query.$and = [
      {
        $or: [
          { statut: { $ne: 'termine' } },
          { statut: 'termine', recurrente: true },
        ],
      },
    ];

    if (search) {
      query.$and.push({
        $or: [
          { titre: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { categorie: { $regex: search, $options: 'i' } },
        ],
      });
    }
    if (type) query.type = type;
    if (statut) query.statut = statut;
    if (categorie) query.categorie = categorie;
    if (zoneId) query.zoneId = zoneId;
    return query;
  }

  async accepter(id: string, responderId: string): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service introuvable');

    if (service.statut !== ServiceStatus.ACTIF) {
      throw new BadRequestException("Ce service n'est plus disponible");
    }

    if (service.createurId.toString() === responderId) {
      throw new BadRequestException(
        'Vous ne pouvez pas accepter votre propre service',
      );
    }

    const conv = await this.conversationsService.getOrCreate(
      id,
      responderId,
      service.createurId.toString(),
    );

    await this.conversationsService.updatePrestationStatus(
      conv._id.toString(),
      'valide',
    );

    let updatedService = service;

    if (service.type === ServiceType.DEMANDE) {
      const otherCandidateIds: Types.ObjectId[] = [];
      try {
        const otherConversations =
          await this.conversationsService.getUserConversations(
            service.createurId.toString(),
          );
        for (const c of otherConversations) {
          if (
            c.serviceId &&
            c.serviceId._id.toString() === id &&
            c._id.toString() !== conv._id.toString()
          ) {
            const otherParticipant = c.participants.find(
              (p) => p._id.toString() !== service.createurId.toString(),
            );
            if (
              otherParticipant &&
              otherParticipant._id.toString() !== responderId
            ) {
              otherCandidateIds.push(
                new Types.ObjectId(otherParticipant._id.toString()),
              );
            }
          }
        }
      } catch (e) {
        console.warn('Could not list other candidates for auto-refusal:', e);
      }

      updatedService = (await this.serviceModel
        .findByIdAndUpdate(
          id,
          {
            $set: { responderId: new Types.ObjectId(responderId) },
            $addToSet: { refusedResponders: { $each: otherCandidateIds } },
          },
          { returnDocument: 'after' },
        )
        .populate('createurId', 'name email picture')
        .populate('responderId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;

      try {
        await this.conversationsService.rejectOtherCandidates(id, responderId);
      } catch (e) {
        console.warn('Could not reject other candidates:', e);
      }
    } else {
      updatedService = (await this.serviceModel
        .findById(id)
        .populate('createurId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;
    }

    try {
      await this.conversationsService.sendSystemMessage(
        conv._id.toString(),
        `🤝 Proposition acceptée ! Le créateur a validé votre profil. Vous pouvez maintenant échanger librement pour planifier les détails.`,
      );
    } catch (e) {
      console.warn('Could not send system message:', e);
    }

    return updatedService;
  }

  async refuser(id: string, responderId: string): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service introuvable');

    const conv = await this.conversationsService.getOrCreate(
      id,
      responderId,
      service.createurId.toString(),
    );

    await this.conversationsService.updatePrestationStatus(
      conv._id.toString(),
      'refuse',
    );

    let updatedService = service;

    if (service.type === ServiceType.DEMANDE) {
      updatedService = (await this.serviceModel
        .findByIdAndUpdate(
          id,
          { $addToSet: { refusedResponders: new Types.ObjectId(responderId) } },
          { returnDocument: 'after' },
        )
        .populate('createurId', 'name email picture')
        .populate('responderId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;
    } else {
      updatedService = (await this.serviceModel
        .findById(id)
        .populate('createurId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;
    }

    try {
      await this.conversationsService.sendSystemMessage(
        conv._id.toString(),
        "Merci d'avoir proposé votre aide ! Le créateur a finalement choisi de s'organiser différemment pour cette fois. À charge de revanche !",
      );
    } catch (e) {
      console.warn('Could not send refusal system message:', e);
    }

    return updatedService;
  }

  async demarrer(
    id: string,
    userId: string,
    conversationId?: string,
  ): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service introuvable');

    let conv: any = null;
    if (conversationId) {
      conv = await this.conversationsService.findOne(conversationId, userId);
    } else {
      const userConversations =
        await this.conversationsService.getUserConversations(userId);
      conv = userConversations.find(
        (c) =>
          c.serviceId &&
          c.serviceId._id.toString() === id &&
          c.prestationStatut === 'valide',
      );
    }

    if (!conv) {
      throw new BadRequestException(
        'Aucune prestation validée trouvée à démarrer pour ce service',
      );
    }

    if (conv.creneau && conv.creneau.date) {
      if (conv.creneau.statut !== 'confirme') {
        throw new BadRequestException(
          "Vous devez d'abord confirmer le créneau horaire du rendez-vous avant de démarrer la prestation.",
        );
      }

      const schedDate = new Date(conv.creneau.date);
      const [hours, minutes] = (conv.creneau.debut || '00:00')
        .split(':')
        .map(Number);
      schedDate.setHours(hours, minutes, 0, 0);

      if (new Date() < schedDate) {
        throw new BadRequestException(
          `Vous ne pouvez pas démarrer cette prestation avant l'heure prévue du rendez-vous (${conv.creneau.debut}).`,
        );
      }
    }

    await this.conversationsService.updatePrestationStatus(
      conv._id.toString(),
      'en_cours',
    );

    let updatedService = service;

    if (service.type === ServiceType.DEMANDE) {
      if (!service.responderId || service.responderId.toString() !== userId) {
        throw new ForbiddenException('Non autorisé à démarrer ce service');
      }
      if (service.statut !== ServiceStatus.ACTIF) {
        throw new BadRequestException(
          "Ce service n'est pas disponible pour démarrage",
        );
      }

      updatedService = (await this.serviceModel
        .findByIdAndUpdate(
          id,
          { $set: { statut: ServiceStatus.EN_COURS } },
          { returnDocument: 'after' },
        )
        .populate('createurId', 'name email picture')
        .populate('responderId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;
    } else {
      updatedService = (await this.serviceModel
        .findById(id)
        .populate('createurId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;
    }

    try {
      const starterName =
        userId === service.createurId.toString()
          ? 'Le prestataire'
          : "L'intervenant";

      await this.conversationsService.sendSystemMessage(
        conv._id.toString(),
        `🚀 ${starterName} a démarré la prestation ! Bon travail à vous deux.`,
      );
    } catch (e) {
      console.warn('Could not send system message for start:', e);
    }

    return updatedService;
  }

  async terminer(
    id: string,
    userId: string,
    conversationId?: string,
  ): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service introuvable');

    let conv: any = null;
    if (conversationId) {
      conv = await this.conversationsService.findOne(conversationId, userId);
    } else {
      const userConversations =
        await this.conversationsService.getUserConversations(userId);
      conv = userConversations.find(
        (c) =>
          c.serviceId &&
          c.serviceId._id.toString() === id &&
          c.prestationStatut === 'en_cours',
      );
    }

    if (!conv) {
      throw new BadRequestException(
        'Aucune prestation en cours trouvée à finaliser',
      );
    }

    await this.conversationsService.updatePrestationStatus(
      conv._id.toString(),
      'termine',
    );

    let updatedService = service;

    if (service.type === ServiceType.DEMANDE) {
      if (!service.responderId || service.responderId.toString() !== userId) {
        throw new ForbiddenException('Non autorisé à finaliser ce service');
      }
      if (service.statut !== ServiceStatus.EN_COURS) {
        throw new BadRequestException("Ce service n'est pas en cours");
      }

      updatedService = (await this.serviceModel
        .findByIdAndUpdate(
          id,
          { $set: { statut: ServiceStatus.TERMINE } },
          { returnDocument: 'after' },
        )
        .populate('createurId', 'name email picture')
        .populate('responderId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;
    } else {
      updatedService = (await this.serviceModel
        .findById(id)
        .populate('createurId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;
    }

    try {
      const finisherName =
        userId === service.createurId.toString()
          ? 'Le prestataire'
          : "L'intervenant";

      await this.conversationsService.sendSystemMessage(
        conv._id.toString(),
        `✅ Prestation déclarée terminée par ${finisherName}. En attente de validation finale par le bénéficiaire...`,
      );
    } catch (e) {
      console.warn('Could not send system message for completion:', e);
    }

    return updatedService;
  }

  async valider(
    id: string,
    userId: string,
    conversationId?: string,
  ): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service introuvable');

    let conv: any = null;
    if (conversationId) {
      conv = await this.conversationsService.findOne(conversationId, userId);
    } else {
      const userConversations =
        await this.conversationsService.getUserConversations(userId);
      conv = userConversations.find(
        (c) =>
          c.serviceId &&
          c.serviceId._id.toString() === id &&
          c.prestationStatut === 'termine',
      );
    }

    if (!conv) {
      throw new BadRequestException(
        'Aucune prestation accomplie trouvée à valider',
      );
    }

    if (service.type === ServiceType.DEMANDE) {
      if (service.createurId.toString() !== userId) {
        throw new ForbiddenException(
          'Non autorisé à valider la réalisation de ce service',
        );
      }
      if (service.statut !== ServiceStatus.TERMINE) {
        throw new BadRequestException("Ce service n'est pas complété");
      }
    } else {
      const isParticipant = conv.participants.some((p: any) => {
        const pIdStr = p._id ? p._id.toString() : p.toString();
        return pIdStr === userId;
      });
      if (!isParticipant || userId === service.createurId.toString()) {
        throw new ForbiddenException(
          'Non autorisé à valider la prestation de cette offre',
        );
      }
    }

    if (!service.gratuit && service.points && service.points > 0) {
      const points = service.points;
      let payerId: Types.ObjectId | null = null;
      let recipientId: Types.ObjectId | null = null;

      if (service.type === ServiceType.DEMANDE) {
        payerId = service.createurId;
        recipientId = service.responderId || null;
      } else {
        const visitor = conv.participants.find((p: any) => {
          const pIdStr = p._id ? p._id.toString() : p.toString();
          return pIdStr !== service.createurId.toString();
        });
        payerId = visitor ? new Types.ObjectId(visitor._id.toString()) : null;
        recipientId = service.createurId;
      }

      if (payerId && recipientId) {
        await this.transactionsService.transferPoints(
          payerId.toString(),
          recipientId.toString(),
          points,
          `Paiement pour le service "${service.titre}"`,
          service._id.toString(),
        );

        const payer = await this.userModel.findById(payerId);
        const recipient = await this.userModel.findById(recipientId);

        try {
          await this.conversationsService.sendSystemMessage(
            conv._id.toString(),
            `Transaction réussie : ${points} points ont été transférés de ${payer ? payer.name : 'Voisin'} à ${recipient ? recipient.name : 'Voisin'}.`,
          );
        } catch (e) {
          console.warn('Could not send system points message:', e);
        }
      }
    }

    await this.conversationsService.updatePrestationStatus(
      conv._id.toString(),
      'termine',
      true,
    );

    let updatedService = service;

    if (service.type === ServiceType.DEMANDE) {
      updatedService = (await this.serviceModel
        .findByIdAndUpdate(
          id,
          { $set: { realisationValidee: true } },
          { returnDocument: 'after' },
        )
        .populate('createurId', 'name email picture')
        .populate('responderId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;
    } else {
      updatedService = (await this.serviceModel
        .findById(id)
        .populate('createurId', 'name email picture')
        .populate('zoneId', 'nom ville'))!;
    }

    try {
      await this.conversationsService.sendSystemMessage(
        conv._id.toString(),
        `🎉 Réalisation validée par le bénéficiaire. Le service est désormais clos avec succès. Merci pour ce beau coup de main !`,
      );
    } catch (e) {
      console.warn('Could not send validation system message:', e);
    }

    return updatedService;
  }
}
