import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(
    createContractDto: CreateContractDto,
  ): Promise<ContractDocument> {
    const { clientId, providerId, serviceId, title, terms, pricePoints } =
      createContractDto;

    if (clientId === providerId) {
      throw new BadRequestException(
        'Un utilisateur ne peut pas conclure un contrat avec lui-même',
      );
    }

    // Verify client and provider exist
    const [client, provider, service] = await Promise.all([
      this.usersService.findById(clientId),
      this.usersService.findById(providerId),
      this.serviceModel.findById(serviceId),
    ]);

    if (!client) throw new NotFoundException('Client introuvable');
    if (!provider) throw new NotFoundException('Prestataire introuvable');
    if (!service) throw new NotFoundException('Service introuvable');

    // Optional points check: verify client has enough points to start
    if (client.points < pricePoints) {
      throw new BadRequestException(
        `Le client n'a pas assez de points. Requis: ${pricePoints} pts, Actuel: ${client.points} pts`,
      );
    }

    const contract = new this.contractModel({
      clientId: new Types.ObjectId(clientId),
      providerId: new Types.ObjectId(providerId),
      serviceId: new Types.ObjectId(serviceId),
      title,
      terms,
      pricePoints,
      status: ContractStatus.PENDING,
      clientSignature: { signed: false },
      providerSignature: { signed: false },
    });

    const savedContract = await contract.save();

    // Link the contract to the service
    service.contractId = savedContract._id;
    service.statut = ServiceStatus.EN_COURS;
    await service.save();

    return savedContract;
  }

  async sign(
    contractId: string,
    userId: string,
    signContractDto: SignContractDto,
  ): Promise<ContractDocument> {
    const contract = await this.contractModel.findById(contractId).exec();
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

    const ipAddress = signContractDto.ipAddress || '127.0.0.1';
    const metadata = signContractDto.signatureMetadata;

    // Cryptographic hash generation
    const payloadToHash = `${contract._id}-${userId}-${contract.terms}-${contract.pricePoints}-${ipAddress}-${metadata}-${new Date().toISOString()}`;
    const hash = crypto
      .createHash('sha256')
      .update(payloadToHash)
      .digest('hex');

    if (isClient) {
      if (contract.clientSignature.signed) {
        throw new BadRequestException('Vous avez déjà signé ce contrat');
      }
      contract.clientSignature = {
        signed: true,
        signedAt: new Date(),
        ipAddress,
        signatureMetadata: metadata,
        hash,
      };
    } else {
      if (contract.providerSignature.signed) {
        throw new BadRequestException('Vous avez déjà signé ce contrat');
      }
      contract.providerSignature = {
        signed: true,
        signedAt: new Date(),
        ipAddress,
        signatureMetadata: metadata,
        hash,
      };
    }

    // If both parties have signed, update contract status to SIGNED
    if (contract.clientSignature.signed && contract.providerSignature.signed) {
      contract.status = ContractStatus.SIGNED;
    }

    return contract.save();
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

    // Only client or provider can initiate completion
    const isClient = contract.clientId.toString() === userId;
    const isProvider = contract.providerId.toString() === userId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de clore ce contrat",
      );
    }

    // Perform the transfer of points using TransactionsService
    await this.transactionsService.transferPoints(
      contract.clientId.toString(),
      contract.providerId.toString(),
      contract.pricePoints,
      `Paiement pour le service sous contrat : ${contract.title}`,
      contract.serviceId.toString(),
    );

    // Update contract status
    contract.status = ContractStatus.COMPLETED;
    const saved = await contract.save();

    // Update service status
    await this.serviceModel.findByIdAndUpdate(contract.serviceId, {
      statut: ServiceStatus.TERMINE,
      realisationValidee: true,
    });

    return saved;
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

    // Only parties involved can cancel
    const isClient = contract.clientId.toString() === userId;
    const isProvider = contract.providerId.toString() === userId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation d'annuler ce contrat",
      );
    }

    contract.status = ContractStatus.CANCELLED;
    const saved = await contract.save();

    // Revert service status
    await this.serviceModel.findByIdAndUpdate(contract.serviceId, {
      statut: ServiceStatus.ANNULE,
    });

    return saved;
  }

  async findOne(contractId: string, userId: string): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findById(contractId)
      .populate('clientId', 'name email picture')
      .populate('providerId', 'name email picture')
      .populate('serviceId', 'titre description categorie')
      .exec();

    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    // Only client or provider can view contract details
    const isClient = contract.clientId._id.toString() === userId;
    const isProvider = contract.providerId._id.toString() === userId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation d'accéder aux détails de ce contrat",
      );
    }

    return contract;
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
      .exec();
  }
}
