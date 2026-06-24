import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Event, EventDocument, EventStatus } from '../schemas/event.schema';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../../contracts/schemas/contract.schema';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventResponseDto } from '../dto/event-response.dto';
import { ConversationsService } from '../../conversations/services/conversations.service';
import { TransactionsService } from '../../transactions/services/transactions.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    private readonly conversationsService: ConversationsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    createurId: string,
  ): Promise<EventResponseDto> {
    try {
      const newEvent = new this.eventModel({
        ...createEventDto,
        createurId: new Types.ObjectId(createurId),
      });
      const saved = await newEvent.save();

      const conv = await this.conversationsService.createForEvent(
        saved._id.toString(),
        createurId,
        saved.titre,
      );
      saved.conversationId = conv._id;
      await saved.save();

      return this.toDto(saved);
    } catch {
      throw new InternalServerErrorException(
        "Erreur lors de la création de l'événement",
      );
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    categorie?: string,
    statut?: string,
  ) {
    const query = this.buildSearchQuery(search, categorie, statut);
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.eventModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ date: 1 })
        .populate('participants', 'name picture')
        .lean(),
      this.eventModel.countDocuments(query),
    ]);

    return {
      events: events.map((e) => this.toDto(e as EventDocument)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<EventResponseDto | null> {
    const event = await this.eventModel
      .findById(id)
      .populate('participants', 'name picture');
    return event ? this.toDto(event) : null;
  }

  async toggleInteret(
    id: string,
    userId: string,
  ): Promise<{ interested: boolean }> {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Événement introuvable');

    const userObjId = new Types.ObjectId(userId);
    const alreadyInterested = event.interesses.some((i) => i.equals(userObjId));

    if (alreadyInterested) {
      await this.eventModel.findByIdAndUpdate(id, {
        $pull: { interesses: userObjId },
      });
      return { interested: false };
    } else {
      await this.eventModel.findByIdAndUpdate(id, {
        $addToSet: { interesses: userObjId },
      });
      return { interested: true };
    }
  }

  async participer(
    id: string,
    userId: string,
  ): Promise<{ participating: boolean }> {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Événement introuvable');

    const userObjId = new Types.ObjectId(userId);

    if (event.createurId.equals(userObjId)) {
      throw new BadRequestException(
        'Vous ne pouvez pas vous inscrire à votre propre événement',
      );
    }

    const isRegistered = event.participants.some((p) => p.equals(userObjId));

    if (isRegistered) {
      if (event.payant) {
        await this.contractModel.findOneAndUpdate(
          {
            eventId: event._id,
            clientId: userObjId,
            status: { $ne: ContractStatus.CANCELLED },
          },
          { $set: { status: ContractStatus.CANCELLED } },
        );

        if (event.pointsCout && event.pointsCout > 0) {
          try {
            await this.transactionsService.transferPoints(
              event.createurId.toString(),
              userId,
              event.pointsCout,
              `Remboursement désinscription "${event.titre}"`,
              id,
            );
          } catch {
            // Solde insuffisant
          }
        }
      }

      await this.eventModel.findByIdAndUpdate(id, {
        $pull: { participants: userObjId },
      });
      await this.conversationsService.removeParticipantFromEvent(id, userId);
      return { participating: false };
    }

    if (event.participants.length >= event.capacite) {
      throw new BadRequestException('Cet événement est complet');
    }

    if (event.payant && event.pointsCout && event.pointsCout > 0) {
      const contract = await this.contractModel
        .findOne({
          eventId: event._id,
          clientId: userObjId,
          status: { $ne: ContractStatus.CANCELLED },
        })
        .exec();

      if (!contract) {
        if (!event.templateDocumentId) {
          throw new BadRequestException(
            "Cet événement payant requiert une charte de participation qui n'a pas encore été configurée par l'organisateur.",
          );
        }

        const newContract = new this.contractModel({
          clientId: userObjId,
          providerId: event.createurId,
          eventId: event._id,
          title: `Charte de participation - ${event.titre}`,
          terms: `En signant ce document, je m'engage à participer à l'événement ${event.titre} et accepte le transfert de ${event.pointsCout} points de mon compte.`,
          pricePoints: event.pointsCout,
          templateDocumentId: event.templateDocumentId,
          signatureZones: [
            {
              page: 1,
              x: 380,
              y: 720,
              width: 150,
              height: 50,
              assignee: 'client',
            },
          ],
          status: ContractStatus.PENDING,
          clientSignature: { signed: false },
          providerSignature: {
            signed: true,
            signedAt: new Date(),
            ipAddress: '127.0.0.1',
            signatureMetadata: 'System Auto-Sign (Waiver template)',
            hash: crypto
              .createHash('sha256')
              .update(`event-${event._id}-creator-${event.createurId}`)
              .digest('hex'),
            signatureImage:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          },
        });
        await newContract.save();

        throw new BadRequestException({
          message: 'Signature du contrat requise pour participer',
          code: 'CONTRACT_SIGNATURE_REQUIRED',
          contractId: newContract._id.toString(),
        });
      }

      if (contract.status === ContractStatus.PENDING) {
        throw new BadRequestException({
          message: 'Signature du contrat requise pour participer',
          code: 'CONTRACT_SIGNATURE_REQUIRED',
          contractId: contract._id.toString(),
        });
      }

    }

    await this.eventModel.findByIdAndUpdate(id, {
      $addToSet: { participants: userObjId },
    });
    await this.conversationsService.addParticipantToEvent(id, userId);
    return { participating: true };
  }

  async valider(
    id: string,
    createurId: string,
    presentIds: string[],
  ): Promise<EventResponseDto> {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Événement introuvable');

    if (event.createurId.toString() !== createurId) {
      throw new ForbiddenException(
        'Seul le créateur peut valider cet événement',
      );
    }

    if (event.statut === EventStatus.COMPLETED) {
      throw new BadRequestException('Cet événement est déjà validé');
    }

    if (new Date(event.date) > new Date()) {
      throw new BadRequestException(
        "Impossible de valider un événement qui n'a pas encore eu lieu",
      );
    }

    const validPresentIds = presentIds.filter((pid) =>
      event.participants.some((p) => p.toString() === pid),
    );

    await this.transactionsService.awardPoints(
      createurId,
      event.pointsCreateur,
      `Récompense organisation de l'événement "${event.titre}"`,
      id,
    );

    for (const pid of validPresentIds) {
      await this.transactionsService.awardPoints(
        pid,
        event.pointsParticipant,
        `Récompense participation à l'événement "${event.titre}"`,
        id,
      );
    }

    const updated = await this.eventModel.findByIdAndUpdate(
      id,
      {
        $set: {
          statut: EventStatus.COMPLETED,
          participantsPresents: validPresentIds.map(
            (pid) => new Types.ObjectId(pid),
          ),
        },
      },
      { new: true },
    );

    const presentCount = validPresentIds.length;
    await this.conversationsService
      .sendSystemMessage(
        event.conversationId?.toString() ?? '',
        `🎉 Événement validé par l'organisateur ! ${presentCount} participant${presentCount > 1 ? 's' : ''} présent${presentCount > 1 ? 's' : ''}. Les points ont été distribués.`,
      )
      .catch(() => undefined);

    return this.toDto(updated!);
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    const event = await this.eventModel.findByIdAndUpdate(
      id,
      { $set: updateEventDto },
      { returnDocument: 'after' },
    );
    if (!event) throw new NotFoundException('Événement introuvable');
    return this.toDto(event);
  }

  async delete(id: string) {
    const result = await this.eventModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Événement introuvable');
    return { message: 'Événement supprimé' };
  }

  private buildSearchQuery(
    search?: string,
    categorie?: string,
    statut?: string,
  ) {
    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { categorie: { $regex: search, $options: 'i' } },
      ];
    }
    if (categorie) query.categorie = categorie;
    if (statut) query.statut = statut;
    return query;
  }

  private toDto(event: EventDocument): EventResponseDto {
    const raw = event as any;
    const rawParticipants: any[] = raw.participants ?? [];

    const participantsFull = rawParticipants
      .filter((p: any) => p && typeof p === 'object' && p._id)
      .map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        picture: p.picture,
      }));

    return {
      id: (event._id as unknown as string).toString(),
      createurId: raw.createurId?.toString() ?? '',
      titre: event.titre,
      description: event.description,
      categorie: event.categorie,
      date: event.date,
      lieu: event.lieu,
      capacite: event.capacite,
      statut: event.statut,
      interesses: (event.interesses ?? []).map((i: any) =>
        typeof i === 'object' && i._id ? i._id.toString() : i.toString(),
      ),
      participants: rawParticipants.map((p: any) =>
        typeof p === 'object' && p._id ? p._id.toString() : p.toString(),
      ),
      participantsFull:
        participantsFull.length > 0 ? participantsFull : undefined,
      payant: event.payant ?? false,
      pointsCout: event.pointsCout,
      pointsCreateur: event.pointsCreateur ?? 10,
      pointsParticipant: event.pointsParticipant ?? 5,
      participantsPresents: (event.participantsPresents ?? []).map((p: any) =>
        typeof p === 'object' && p._id ? p._id.toString() : p.toString(),
      ),
      photoUrl: event.photoUrl,
      conversationId: raw.conversationId?.toString(),
      templateDocumentId: raw.templateDocumentId?.toString(),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
