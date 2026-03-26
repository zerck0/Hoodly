import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from '../schemas/event.schema';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventResponseDto } from '../dto/event-response.dto';

@Injectable()
export class EventsService {
  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  async create(createEventDto: CreateEventDto): Promise<EventResponseDto> {
    try {
      const newEvent = new this.eventModel(createEventDto);
      const saved = await newEvent.save();
      return this.toDto(saved);
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
    const query = this.buildSearchQuery(search, categorie, statut);
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
      events: events.map((e) => this.toDto(e as EventDocument)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<EventResponseDto | null> {
    const event = await this.eventModel.findById(id);
    return event ? this.toDto(event) : null;
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
    return {
      id: (event._id as unknown as string).toString(),
      titre: event.titre,
      categorie: event.categorie,
      date: event.date,
      lieu: event.lieu,
      capacite: event.capacite,
      statut: event.statut,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
