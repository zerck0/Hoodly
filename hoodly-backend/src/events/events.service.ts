import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  async create(createEventDto: CreateEventDto): Promise<EventDocument> {
    try {
      const newEvent = new this.eventModel(createEventDto);
      return await newEvent.save();
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la création de l\'événement',
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
    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { categorie: { $regex: search, $options: 'i' } },
      ];
    }

    if (categorie) query.categorie = categorie;
    if (statut) query.statut = statut;

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.eventModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ date: -1 })
        .lean(),
      this.eventModel.countDocuments(query),
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<EventDocument | null> {
    return this.eventModel.findById(id);
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventDocument> {
    const event = await this.eventModel.findByIdAndUpdate(
      id,
      { $set: updateEventDto },
      { new: true },
    );
    if (!event) throw new NotFoundException('Événement introuvable');
    return event;
  }

  async delete(id: string) {
    const result = await this.eventModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Événement introuvable');
    return { message: 'Événement supprimé' };
  }
}
