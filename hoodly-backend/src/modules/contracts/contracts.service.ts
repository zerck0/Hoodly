import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from './schemas/contract.schema';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { UsersService } from '../users/services/users.service';
import { TransactionsService } from '../transactions/services/transactions.service';
import { TransactionType } from '../transactions/schemas/transaction.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { DocumentsService } from '../documents/documents.service';
import { EmailsService } from '../emails/emails.service';
import { UploadsService } from '../uploads/services/uploads.service';
import {
  DocumentType,
  DocumentStatus,
} from '../documents/schemas/document.schema';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ConversationsService } from '../conversations/services/conversations.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly documentsService: DocumentsService,
    private readonly emailsService: EmailsService,
    private readonly uploadsService: UploadsService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
  ) {}

  async create(
    createContractDto: CreateContractDto,
  ): Promise<ContractDocument> {
    const {
      clientId,
      providerId,
      serviceId,
      eventId,
      title,
      terms,
      pricePoints,
      templateDocumentId,
      signatureZones,
    } = createContractDto;

    if (clientId === providerId) {
      throw new BadRequestException(
        'Un utilisateur ne peut pas conclure un contrat avec lui-même',
      );
    }

    const [client, provider, templateDoc] = await Promise.all([
      this.usersService.findById(clientId),
      this.usersService.findById(providerId),
      this.documentsService.findById(templateDocumentId),
    ]);

    if (!client) throw new NotFoundException('Client introuvable');
    if (!provider) throw new NotFoundException('Prestataire introuvable');
    if (!templateDoc)
      throw new NotFoundException('Document modèle introuvable');

    if (client.points < pricePoints) {
      throw new BadRequestException(
        `Le client n'a pas assez de points. Requis: ${pricePoints} pts, Actuel: ${client.points} pts`,
      );
    }

    const contract = new this.contractModel({
      clientId: new Types.ObjectId(clientId),
      providerId: new Types.ObjectId(providerId),
      serviceId: serviceId ? new Types.ObjectId(serviceId) : undefined,
      eventId: eventId ? new Types.ObjectId(eventId) : undefined,
      title,
      terms,
      pricePoints,
      templateDocumentId: new Types.ObjectId(templateDocumentId),
      signatureZones: signatureZones || [],
      status: ContractStatus.PENDING,
      clientSignature: { signed: false },
      providerSignature: { signed: false },
    });

    const savedContract = await contract.save();

    if (serviceId) {
      const service = await this.serviceModel.findById(serviceId);
      if (!service) throw new NotFoundException('Service introuvable');
      service.contractId = savedContract._id;
      service.statut = ServiceStatus.EN_COURS;
      await service.save();
    }

    return savedContract;
  }

  async sendOtp(
    contractId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const contract = await this.contractModel.findById(contractId).exec();
    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    if (contract.status !== ContractStatus.PENDING) {
      throw new BadRequestException(
        'Le contrat n’est pas en attente de signature',
      );
    }

    const isClient = contract.clientId.toString() === userId;
    const isProvider = contract.providerId.toString() === userId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException(
        "Vous n'êtes pas partie prenante de ce contrat",
      );
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (isClient) {
      contract.clientSignature.otpHash = otpHash;
      contract.clientSignature.otpExpiresAt = otpExpiresAt;
    } else {
      contract.providerSignature.otpHash = otpHash;
      contract.providerSignature.otpExpiresAt = otpExpiresAt;
    }

    await contract.save();

    await this.emailsService.sendOTPEmail(user.email, user.name || '', otp);

    return { message: 'Code de vérification envoyé par e-mail' };
  }

  async sign(
    contractId: string,
    userId: string,
    signContractDto: SignContractDto,
  ): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findById(contractId)
      .select(
        '+clientSignature.otpHash +clientSignature.otpExpiresAt +providerSignature.otpHash +providerSignature.otpExpiresAt',
      )
      .exec();
    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    if (contract.status !== ContractStatus.PENDING) {
      throw new BadRequestException(
        `Le contrat ne peut pas être signé dans son état actuel : ${contract.status}`,
      );
    }

    const isClient = contract.clientId.toString() === userId;
    const isProvider = contract.providerId.toString() === userId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException(
        "Vous n'êtes pas partie prenante de ce contrat",
      );
    }

    const signatureDetail = isClient
      ? contract.clientSignature
      : contract.providerSignature;

    if (signatureDetail.signed) {
      throw new BadRequestException('Vous avez déjà signé ce contrat');
    }

    if (!signatureDetail.otpHash || !signatureDetail.otpExpiresAt) {
      throw new BadRequestException(
        'Aucun code OTP n’a été généré pour cette signature',
      );
    }

    if (new Date() > signatureDetail.otpExpiresAt) {
      throw new BadRequestException(
        'Le code OTP a expiré. Veuillez en demander un nouveau.',
      );
    }

    const submittedOtpHash = crypto
      .createHash('sha256')
      .update(signContractDto.otp)
      .digest('hex');
    if (submittedOtpHash !== signatureDetail.otpHash) {
      throw new BadRequestException('Code de validation OTP incorrect');
    }

    const ipAddress = signContractDto.ipAddress || '127.0.0.1';
    const metadata = signContractDto.signatureMetadata;

    const payloadToHash = `${contract._id}-${userId}-${contract.terms}-${contract.pricePoints}-${ipAddress}-${metadata}-${signContractDto.otp}-${new Date().toISOString()}`;
    const hash = crypto
      .createHash('sha256')
      .update(payloadToHash)
      .digest('hex');

    signatureDetail.signed = true;
    signatureDetail.signedAt = new Date();
    signatureDetail.ipAddress = ipAddress;
    signatureDetail.signatureMetadata = metadata;
    signatureDetail.hash = hash;
    signatureDetail.signatureImage = signContractDto.signatureImage;

    signatureDetail.otpHash = undefined;
    signatureDetail.otpExpiresAt = undefined;

    let savedContract = await contract.save();

    if (
      savedContract.clientSignature.signed &&
      savedContract.providerSignature.signed
    ) {
      savedContract.status = ContractStatus.SIGNED;
      savedContract = await savedContract.save();

      try {
        savedContract = (await this.sealAndArchiveContract(
          savedContract,
        )) as any;
      } catch (sealErr: any) {
        console.error(
          '[ContractsService] Scellage PDF échoué (non-bloquant) — le contrat reste SIGNED:',
          sealErr?.message,
        );
      }

      if (savedContract.serviceId) {
        const serviceIdStr = savedContract.serviceId.toString();
        const conversation =
          await this.conversationsService.findByServiceId(serviceIdStr);
        if (conversation && conversation.creneau) {
          conversation.prestationStatut = 'valide';
          await conversation.save();

          const dateStr = new Date(
            conversation.creneau.date,
          ).toLocaleDateString('fr-FR');
          await this.conversationsService.sendSystemMessage(
            conversation._id.toString(),
            `🎉 Rendez-vous confirmé ! La prestation est planifiée pour le ${dateStr} de ${conversation.creneau.debut} à ${conversation.creneau.fin}.`,
          );
        }

        if (savedContract.pricePoints > 0) {
          await this.usersService.updatePoints(
            savedContract.clientId.toString(),
            -savedContract.pricePoints,
          );
          savedContract.pointsEscrowed = true;
          savedContract = await savedContract.save();

          await this.transactionsService.create(
            savedContract.clientId.toString(),
            null,
            savedContract.pricePoints,
            TransactionType.SERVICE_PAYMENT,
            `Points mis sous séquestre pour le service sous contrat : ${savedContract.title}`,
            serviceIdStr,
          );
        }
      }

      if (savedContract.eventId) {
        const event = await this.eventModel.findById(savedContract.eventId);
        if (event && event.payant && event.pointsCout) {
          await this.transactionsService.transferPoints(
            savedContract.clientId.toString(),
            savedContract.providerId.toString(),
            savedContract.pricePoints,
            `Inscription confirmée pour l'événement "${event.titre}"`,
            event._id.toString(),
          );

          await this.eventModel.findByIdAndUpdate(event._id, {
            $addToSet: { participants: savedContract.clientId },
          });

          await this.conversationsService.addParticipantToEvent(
            event._id.toString(),
            savedContract.clientId.toString(),
          );
        }
      }
    }

    return savedContract;
  }

  private async sealAndArchiveContract(
    contract: ContractDocument,
  ): Promise<ContractDocument> {
    try {
      const templateDoc = await this.documentsService.findById(
        contract.templateDocumentId.toString(),
      );
      if (!templateDoc)
        throw new NotFoundException('Document modèle introuvable');

      const [clientUser, providerUser] = await Promise.all([
        this.usersService.findById(contract.clientId.toString()),
        this.usersService.findById(contract.providerId.toString()),
      ]);
      if (!clientUser || !providerUser) {
        throw new NotFoundException(
          'Utilisateurs associés au contrat introuvables',
        );
      }

      const pdfBytes = await this.uploadsService.downloadFile(
        templateDoc.fileUrl,
      );

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      for (const zone of contract.signatureZones) {
        const pageIndex = zone.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        const page = pages[pageIndex];
        const { height: pageHeight } = page.getSize();

        const yPdf = pageHeight - zone.y - zone.height;

        let signatureBase64: string | undefined;
        if (zone.assignee === 'client') {
          signatureBase64 = contract.clientSignature.signatureImage;
        } else if (zone.assignee === 'provider') {
          signatureBase64 = contract.providerSignature.signatureImage;
        }

        if (signatureBase64) {
          const pureBase64 = signatureBase64.split(',')[1] || signatureBase64;
          const imgBuffer = Buffer.from(pureBase64, 'base64');
          const embeddedImg = await pdfDoc.embedPng(imgBuffer);

          page.drawImage(embeddedImg, {
            x: zone.x,
            y: yPdf,
            width: zone.width,
            height: zone.height,
          });
        }
      }

      const newPage = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      newPage.drawText('Certificat de Signature Electronique - Hoodly', {
        x: 50,
        y: 780,
        size: 16,
        font: fontBold,
        color: rgb(0, 0.4, 0.2),
      });

      newPage.drawLine({
        start: { x: 50, y: 760 },
        end: { x: 545, y: 760 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      let currentY = 720;
      newPage.drawText(`Document : ${contract.title}`, {
        x: 50,
        y: currentY,
        size: 12,
        font: fontBold,
      });
      currentY -= 20;
      newPage.drawText(`Identifiant du contrat : ${contract._id}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 20;
      newPage.drawText(
        `Date de scellage : ${new Date().toLocaleString('fr-FR')}`,
        { x: 50, y: currentY, size: 10, font },
      );
      currentY -= 40;

      newPage.drawText('Signataire 1 : Client', {
        x: 50,
        y: currentY,
        size: 12,
        font: fontBold,
      });
      currentY -= 20;
      newPage.drawText(`Nom : ${clientUser.name}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 15;
      newPage.drawText(`Email : ${clientUser.email}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 15;
      newPage.drawText(
        `IP : ${contract.clientSignature.ipAddress || 'Non enregistrée'}`,
        { x: 50, y: currentY, size: 10, font },
      );
      currentY -= 15;
      newPage.drawText(
        `Date : ${contract.clientSignature.signedAt?.toLocaleString('fr-FR') || 'Non signée'}`,
        { x: 50, y: currentY, size: 10, font },
      );
      currentY -= 15;
      newPage.drawText(
        `Empreinte (Hash) : ${contract.clientSignature.hash || 'N/A'}`,
        { x: 50, y: currentY, size: 8, font },
      );
      currentY -= 40;

      newPage.drawText('Signataire 2 : Prestataire / Organisateur', {
        x: 50,
        y: currentY,
        size: 12,
        font: fontBold,
      });
      currentY -= 20;
      newPage.drawText(`Nom : ${providerUser.name}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 15;
      newPage.drawText(`Email : ${providerUser.email}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 15;
      newPage.drawText(
        `IP : ${contract.providerSignature.ipAddress || 'Non enregistrée'}`,
        { x: 50, y: currentY, size: 10, font },
      );
      currentY -= 15;
      newPage.drawText(
        `Date : ${contract.providerSignature.signedAt?.toLocaleString('fr-FR') || 'Non signée'}`,
        { x: 50, y: currentY, size: 10, font },
      );
      currentY -= 15;
      newPage.drawText(
        `Empreinte (Hash) : ${contract.providerSignature.hash || 'N/A'}`,
        { x: 50, y: currentY, size: 8, font },
      );
      currentY -= 40;

      newPage.drawLine({
        start: { x: 50, y: currentY },
        end: { x: 545, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      currentY -= 30;

      newPage.drawText('Document certifie et scelle par Hoodly', {
        x: 50,
        y: currentY,
        size: 11,
        font: fontBold,
        color: rgb(0, 0.4, 0.2),
      });
      currentY -= 15;
      newPage.drawText(
        'Ce document PDF a ete signe numeriquement avec authentification double facteur (OTP e-mail).',
        {
          x: 50,
          y: currentY,
          size: 8,
          font,
        },
      );

      const finalPdfBytes = await pdfDoc.save();
      const signedPdfHash = crypto
        .createHash('sha256')
        .update(finalPdfBytes)
        .digest('hex');

      const fileUrl = await this.uploadsService.uploadFile({
        fieldname: 'file',
        originalname: `contract_${contract._id}_signed.pdf`,
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: finalPdfBytes.length,
        buffer: Buffer.from(finalPdfBytes),
      });

      const finalDocument = await this.documentsService.create({
        ownerId: contract.providerId.toString(),
        title: `Contrat Signe - ${contract.title}`,
        fileUrl,
        pdfHash: signedPdfHash,
        type: DocumentType.SIGNED_CONTRACT,
      });
      await this.documentsService.updateStatus(
        finalDocument._id.toString(),
        DocumentStatus.ARCHIVED,
      );

      contract.signedDocumentId = finalDocument._id;

      await Promise.all([
        this.emailsService.sendContractSignedNotification(
          clientUser.email,
          clientUser.name || '',
          contract.title,
          fileUrl,
        ),
        this.emailsService.sendContractSignedNotification(
          providerUser.email,
          providerUser.name || '',
          contract.title,
          fileUrl,
        ),
      ]);

      return contract;
    } catch (err: any) {
      console.error('[ContractsService] Erreur scellage PDF:', err);
      throw new BadRequestException(`Erreur scellage PDF: ${err.message}`);
    }
  }

  async complete(
    contractId: string,
    userId: string,
  ): Promise<ContractDocument> {
    const contract = await this.contractModel.findById(contractId).exec();
    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    if (contract.status !== ContractStatus.SIGNED) {
      throw new BadRequestException(
        'Le contrat doit être signé par les deux parties pour être complété',
      );
    }

    const isClient = contract.clientId.toString() === userId;
    const isProvider = contract.providerId.toString() === userId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de clore ce contrat",
      );
    }

    if (contract.serviceId) {
      if (contract.pointsEscrowed && contract.pricePoints > 0) {
        await this.usersService.updatePoints(
          contract.providerId.toString(),
          contract.pricePoints,
        );

        await this.transactionsService.create(
          null,
          contract.providerId.toString(),
          contract.pricePoints,
          TransactionType.SERVICE_PAYMENT,
          `Paiement pour le service sous contrat : ${contract.title}`,
          contract.serviceId.toString(),
        );
      } else if (!contract.pointsEscrowed && contract.pricePoints > 0) {
        await this.transactionsService.transferPoints(
          contract.clientId.toString(),
          contract.providerId.toString(),
          contract.pricePoints,
          `Paiement pour le service sous contrat : ${contract.title}`,
          contract.serviceId.toString(),
        );
      }

      await this.serviceModel.findByIdAndUpdate(contract.serviceId, {
        statut: ServiceStatus.TERMINE,
        realisationValidee: true,
      });

      const conversation = await this.conversationsService.findByServiceId(
        contract.serviceId.toString(),
      );
      if (conversation) {
        conversation.prestationStatut = 'termine';
        conversation.realisationValidee = true;
        await conversation.save();

        await this.conversationsService.sendSystemMessage(
          conversation._id.toString(),
          `✅ Prestation validée et terminée ! Le transfert de ${contract.pricePoints} points au prestataire a été effectué.`,
        );
      }
    }

    contract.status = ContractStatus.COMPLETED;

    try {
      const clientUser = await this.usersService.findById(
        contract.clientId.toString(),
      );
      const providerUser = await this.usersService.findById(
        contract.providerId.toString(),
      );

      if (clientUser && clientUser.email) {
        this.emailsService.sendServiceCompletedClientEmail(
          clientUser.email,
          clientUser.name || '',
          providerUser ? providerUser.name || '' : '',
          contract.title,
          contract.pricePoints,
        ).catch((err) => {
          console.error(`[ContractsService] Error sending service completed client email: ${err.message}`);
        });
      }

      if (providerUser && providerUser.email) {
        this.emailsService.sendServiceCompletedProviderEmail(
          providerUser.email,
          providerUser.name || '',
          clientUser ? clientUser.name || '' : '',
          contract.title,
          contract.pricePoints,
        ).catch((err) => {
          console.error(`[ContractsService] Error sending service completed provider email: ${err.message}`);
        });
      }
    } catch (err: any) {
      console.error(`[ContractsService] Error fetching users for completion emails: ${err.message}`);
    }

    return contract.save();
  }

  async cancel(contractId: string, userId: string): Promise<ContractDocument> {
    const contract = await this.contractModel.findById(contractId).exec();
    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    if (
      contract.status === ContractStatus.COMPLETED ||
      contract.status === ContractStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Le contrat ne peut plus être annulé. Statut: ${contract.status}`,
      );
    }

    const isClient = contract.clientId.toString() === userId;
    const isProvider = contract.providerId.toString() === userId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation d'annuler ce contrat",
      );
    }

    contract.status = ContractStatus.CANCELLED;

    if (contract.pointsEscrowed && contract.pricePoints > 0) {
      await this.usersService.updatePoints(
        contract.clientId.toString(),
        contract.pricePoints,
      );

      await this.transactionsService.create(
        null,
        contract.clientId.toString(),
        contract.pricePoints,
        TransactionType.SERVICE_PAYMENT,
        `Remboursement du séquestre pour le contrat annulé : ${contract.title}`,
        contract.serviceId?.toString(),
      );

      contract.pointsEscrowed = false;
    }

    const saved = await contract.save();

    if (contract.serviceId) {
      await this.serviceModel.findByIdAndUpdate(contract.serviceId, {
        statut: ServiceStatus.ANNULE,
      });

      const conversation = await this.conversationsService.findByServiceId(
        contract.serviceId.toString(),
      );
      if (conversation) {
        conversation.prestationStatut = 'aucun';
        if (conversation.creneau) {
          conversation.creneau.statut = 'annule';
        }
        await conversation.save();

        await this.conversationsService.sendSystemMessage(
          conversation._id.toString(),
          `❌ Le contrat d'entraide payant a été annulé. Le rendez-vous a été annulé et les points ont été restitués au client.`,
        );
      }
    }

    return saved;
  }

  async findOne(contractId: string, userId: string): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findById(contractId)
      .populate('clientId', 'name email picture')
      .populate('providerId', 'name email picture')
      .populate('serviceId', 'titre description categorie')
      .populate('templateDocumentId')
      .populate('signedDocumentId')
      .exec();

    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    const isClient = contract.clientId._id.toString() === userId;
    const isProvider = contract.providerId._id.toString() === userId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation d'accéder aux détails de ce contrat",
      );
    }

    return contract;
  }

  async findActiveContractForService(
    serviceId: string,
  ): Promise<ContractDocument | null> {
    return this.contractModel
      .findOne({
        serviceId: new Types.ObjectId(serviceId),
        status: { $ne: ContractStatus.CANCELLED },
      })
      .exec();
  }

  async findById(contractId: string): Promise<ContractDocument | null> {
    return this.contractModel.findById(contractId).exec();
  }

  async findAllForUser(userId: string): Promise<ContractDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    return this.contractModel
      .find({
        $or: [{ clientId: userObjectId }, { providerId: userObjectId }],
      })
      .sort({ createdAt: -1 })
      .populate('clientId', 'name email picture')
      .populate('providerId', 'name email picture')
      .populate('serviceId', 'titre description categorie')
      .populate('templateDocumentId')
      .populate('signedDocumentId')
      .exec();
  }
}
