import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Document,
  DocumentDocument,
  DocumentStatus,
  DocumentType,
} from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import * as crypto from 'crypto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name)
    private readonly documentModel: Model<DocumentDocument>,
  ) {}

  async findOrCreateTemplate(ownerId: string): Promise<DocumentDocument> {
    let doc = await this.documentModel
      .findOne({ type: DocumentType.CONTRACT_TEMPLATE })
      .exec();
    if (!doc) {
      const genericDoc = new this.documentModel({
        ownerId: new Types.ObjectId(ownerId),
        title: `Template Charte de participation`,
        fileUrl:
          'https://hoodly.s3.amazonaws.com/templates/default_participation_waiver.pdf',
        pdfHash: crypto
          .createHash('sha256')
          .update('generic-template')
          .digest('hex'),
        type: DocumentType.CONTRACT_TEMPLATE,
        status: DocumentStatus.APPROVED,
      });
      doc = await genericDoc.save();
    }
    return doc;
  }

  async create(
    createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentDocument> {
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
    return this.documentModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .exec();
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
  ): Promise<DocumentDocument> {
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

  async findWithFilter(
    filter: Record<string, any>,
  ): Promise<DocumentDocument[]> {
    const queryFilter = { ...filter };
    if (queryFilter.ownerId && typeof queryFilter.ownerId === 'string') {
      try {
        queryFilter.ownerId = new Types.ObjectId(queryFilter.ownerId);
      } catch (ignored) {
        /* ignored */
      }
    }
    return this.documentModel.find(queryFilter).exec();
  }
}
