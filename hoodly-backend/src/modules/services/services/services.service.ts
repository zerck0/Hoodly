import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from '../schemas/service.schema';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
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
        .populate('respondeId', 'name email picture')
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
      .populate('respondeId', 'name email picture')
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
    if (search) {
      query.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { categorie: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) query.type = type;
    if (statut) query.statut = statut;
    if (categorie) query.categorie = categorie;
    if (zoneId) query.zoneId = zoneId;
    return query;
  }
}
