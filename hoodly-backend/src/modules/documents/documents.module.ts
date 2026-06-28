import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document, DocumentSchema } from './schemas/document.schema';
import { UploadsModule } from '../uploads/uploads.module';
import { QueryParserService } from './parser/query-parser.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
    ]),
    UploadsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, QueryParserService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
