import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from '../services/uploads.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let service: UploadsService;

  const mockUploadsService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: mockUploadsService,
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    service = module.get<UploadsService>(UploadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('should throw BadRequestException if no file is provided', async () => {
      await expect(controller.upload(undefined as any)).rejects.toThrow(
        new BadRequestException('Aucun fichier fourni'),
      );
    });

    it('should throw BadRequestException if file type is not allowed', async () => {
      const invalidFile = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 100,
        buffer: Buffer.from('test'),
      };

      await expect(controller.upload(invalidFile as any)).rejects.toThrow(
        new BadRequestException(
          'Type de fichier non autorisé (PDF, JPG, PNG uniquement)',
        ),
      );
    });

    it('should throw BadRequestException if file size exceeds 5MB', async () => {
      const largeFile = {
        fieldname: 'file',
        originalname: 'large.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 6 * 1024 * 1024,
        buffer: Buffer.from('large'),
      };

      await expect(controller.upload(largeFile as any)).rejects.toThrow(
        new BadRequestException('Fichier trop volumineux (max 5MB)'),
      );
    });

    it('should successfully upload an allowed file and return its URL', async () => {
      const validFile = {
        fieldname: 'file',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('image content'),
      };

      mockUploadsService.uploadFile.mockResolvedValue(
        'https://cloudinary.com/test.png',
      );

      const result = await controller.upload(validFile as any);

      expect(mockUploadsService.uploadFile).toHaveBeenCalledWith(validFile);
      expect(result).toEqual({ fileUrl: 'https://cloudinary.com/test.png' });
    });
  });
});
