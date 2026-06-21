import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument, DocumentStatus } from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name)
    private readonly documentModel: Model<DocumentDocument>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<DocumentDocument> {
    const created = new this.documentModel({
      ...createDocumentDto,
      ownerId: new Types.ObjectId(createDocumentDto.ownerId),
    });
    return created.save();
  }

  async findById(id: string): Promise<DocumentDocument | null> {
    return this.documentModel.findById(id).exec();
  }

  async findAll(): Promise<DocumentDocument[]> {
    return this.documentModel.find().exec();
  }

  async findByOwner(ownerId: string): Promise<DocumentDocument[]> {
    return this.documentModel.find({ ownerId: new Types.ObjectId(ownerId) }).exec();
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<DocumentDocument> {
    const doc = await this.documentModel.findById(id);
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }
    doc.status = status;
    return doc.save();
  }

  async remove(id: string): Promise<void> {
    const res = await this.documentModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Document introuvable');
    }
  }
}
