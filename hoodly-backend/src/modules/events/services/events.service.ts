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
import { Neo4jService } from '../../neo4j/neo4j.service';
import { DocumentsService } from '../../documents/documents.service';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { UploadsService } from '../../uploads/services/uploads.service';
import {
  DocumentType,
} from '../../documents/schemas/document.schema';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly conversationsService: ConversationsService,
    private readonly transactionsService: TransactionsService,
    private readonly neo4j: Neo4jService,
    private readonly documentsService: DocumentsService,
    private readonly uploadsService: UploadsService,
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
      this.neo4j.removeInteret(userId, id);
      return { interested: false };
    } else {
      await this.eventModel.findByIdAndUpdate(id, {
        $addToSet: { interesses: userObjId },
      });
      this.neo4j.syncInteret(userId, id, event.categorie);
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
      this.neo4j.removeParticipation(userId, id);
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
        const participantUser = await this.userModel.findById(userId).lean();
        const userPoints = (participantUser as any)?.points ?? 0;
        if (userPoints < event.pointsCout) {
          throw new BadRequestException(
            `Vous n'avez pas assez de points. Requis: ${event.pointsCout} pts, Votre solde: ${userPoints} pts`,
          );
        }

        const organizerUser = await this.userModel
          .findById(event.createurId)
          .lean();
        const participantName = (participantUser as any)?.name || 'Participant';
        const participantEmail = (participantUser as any)?.email || '';
        const organizerName = (organizerUser as any)?.name || 'Organisateur';
        const organizerEmail = (organizerUser as any)?.email || '';

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        page.drawText(`CHARTE DE PARTICIPATION - HOODLY`, {
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

        const eventDate = new Date(event.date);
        const day = String(eventDate.getDate()).padStart(2, '0');
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const year = eventDate.getFullYear();
        const hours = String(eventDate.getHours()).padStart(2, '0');
        const minutes = String(eventDate.getMinutes()).padStart(2, '0');
        const dateStr = `${day}/${month}/${year} a ${hours}:${minutes}`;

        const termsText =
          `CHARTE DE PARTICIPATION DE QUARTIER\n\n` +
          `EVENEMENT :\n` +
          `- Titre : ${event.titre}\n` +
          `- Categorie : ${event.categorie}\n` +
          `- Date & Heure : Le ${dateStr}\n` +
          `- Lieu : ${event.lieu?.ville || event.lieu?.adresse || 'Lieu a definir'}\n\n` +
          `ORGANISATEUR : ${organizerName} (${organizerEmail})\n\n` +
          `PARTICIPANT : ${participantName} (${participantEmail})\n\n` +
          `ENGAGEMENTS DE PARTICIPATION :\n` +
          `1. Je m'engage a participer a l'evenement "${event.titre}" aux date et heure indiquees.\n` +
          `2. J'accepte le transfert automatique de ${event.pointsCout} points de mon compte a la signature.\n` +
          `3. En cas de desinscription ou d'annulation de l'evenement, les points me seront integralement rembourses.\n\n` +
          `SIGNATURES :\n` +
          `En signant ce document par validation e-mail (OTP), le participant s'engage et valide la charte.`;

        const lines = termsText.split('\n');
        let yPos = 720;
        for (const line of lines) {
          const isHeader =
            line.endsWith(':') ||
            line.startsWith('CHARTE') ||
            line.startsWith('EVENEMENT') ||
            line.startsWith('ORGANISATEUR') ||
            line.startsWith('PARTICIPANT') ||
            line.startsWith('ENGAGEMENTS');
          page.drawText(line, {
            x: 50,
            y: yPos,
            size: isHeader ? 10 : 9,
            font: isHeader ? fontBold : font,
            color: isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.3, 0.3, 0.3),
          });
          yPos -= 15;
        }

        page.drawText(`Participant (Signez ci-dessous)`, {
          x: 380,
          y: 145,
          size: 9,
          font: fontBold,
        });
        page.drawRectangle({
          x: 380,
          y: 72,
          width: 150,
          height: 50,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
        });

        page.drawText(`Organisateur (Certifie par le systeme)`, {
          x: 80,
          y: 145,
          size: 9,
          font: fontBold,
        });
        page.drawRectangle({
          x: 80,
          y: 72,
          width: 160,
          height: 50,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
        });
        page.drawText(`Charte publiee par l'hote`, {
          x: 90,
          y: 102,
          size: 8,
          font: font,
          color: rgb(0.2, 0.6, 0.2),
        });
        page.drawText(`(Signature automatique)`, {
          x: 90,
          y: 90,
          size: 8,
          font: font,
          color: rgb(0.2, 0.6, 0.2),
        });

        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);

        const fileUrl = await this.uploadsService.uploadFile({
          fieldname: 'file',
          originalname: `charte_participation_${event._id}_${userId}.pdf`,
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: pdfBuffer.length,
          buffer: pdfBuffer,
        });

        const pdfHash = crypto
          .createHash('sha256')
          .update(pdfBuffer)
          .digest('hex');

        const templateDoc = await this.documentsService.create({
          ownerId: userId,
          title: `Charte de participation - ${event.titre}`,
          fileUrl,
          pdfHash,
          type: DocumentType.CONTRACT_TEMPLATE,
        });

        const newContract = new this.contractModel({
          clientId: userObjId,
          providerId: event.createurId,
          eventId: event._id,
          title: `Charte de participation - ${event.titre}`,
          terms: `En signant ce document, je m'engage à participer à l'événement ${event.titre} et accepte le transfert de ${event.pointsCout} points de mon compte.`,
          pricePoints: event.pointsCout,
          templateDocumentId: templateDoc._id,
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
    this.neo4j.syncParticipation(userId, id, event.categorie);
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
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Événement introuvable');

    if (event.payant && event.pointsCout && event.pointsCout > 0) {
      for (const participantId of event.participants) {
        try {
          await this.transactionsService.transferPoints(
            event.createurId.toString(),
            participantId.toString(),
            event.pointsCout,
            `Remboursement annulation événement "${event.titre}"`,
            id,
          );
        } catch (err) {
          // Ignore
        }
      }

      await this.contractModel.updateMany(
        { eventId: event._id },
        { $set: { status: ContractStatus.CANCELLED } },
      );
    }

    await this.conversationsService.deleteByEventId(id);

    await this.eventModel.findByIdAndDelete(id);

    return { message: 'Événement annulé et participants remboursés' };
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
