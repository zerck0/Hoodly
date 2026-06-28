import { Test, TestingModule } from '@nestjs/testing';
import { QueryParserService } from './query-parser.service';
import { BadRequestException } from '@nestjs/common';

describe('QueryParserService', () => {
  let service: QueryParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryParserService],
    }).compile();

    service = module.get<QueryParserService>(QueryParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parse', () => {
    it('should parse simple FIND', () => {
      const result = service.parse('FIND');
      expect(result).toEqual({});
    });

    it('should parse FIND with one condition', () => {
      const result1 = service.parse('FIND WHERE status = "signed"');
      expect(result1).toEqual({ status: 'signed' });

      const result2 = service.parse("FIND WHERE title = 'Contrat'");
      expect(result2).toEqual({ title: 'Contrat' });
    });

    it('should parse FIND with numeric value', () => {
      const result = service.parse('FIND WHERE points = 100');
      expect(result).toEqual({ points: 100 });
    });

    it('should parse FIND with multiple AND conditions', () => {
      const result = service.parse('FIND WHERE status = "signed" AND type = "contract"');
      expect(result).toEqual({ status: 'signed', type: 'contract' });
    });

    it('should throw BadRequestException on syntax error', () => {
      expect(() => service.parse('FIND WHERE status =')).toThrow(BadRequestException);
      expect(() => service.parse('SELECT FROM documents')).toThrow(BadRequestException);
    });
  });
});
