import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UploadsService } from './uploads.service';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

describe('UploadsService', () => {
  let service: UploadsService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'CLOUDINARY_CLOUD_NAME') return 'test-cloud';
              if (key === 'CLOUDINARY_API_KEY') return 'test-key';
              if (key === 'CLOUDINARY_API_SECRET') return 'test-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should configure cloudinary in the constructor', () => {
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });
  });

  describe('uploadFile', () => {
    it('should successfully upload a file and return the secure_url', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100,
        buffer: Buffer.from('test-buffer'),
      };

      const mockEnd = jest.fn();

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          setTimeout(() => {
            callback(null, { secure_url: 'https://cloudinary.com/test.jpg' });
          }, 0);
          return {
            end: mockEnd,
          };
        },
      );

      const url = await service.uploadFile(mockFile);

      expect(url).toBe('https://cloudinary.com/test.jpg');
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'hoodly',
          resource_type: 'auto',
        },
        expect.any(Function),
      );
      expect(mockEnd).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should reject when cloudinary returns an error', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100,
        buffer: Buffer.from('test-buffer'),
      };

      const mockEnd = jest.fn();
      const mockError = new Error('Cloudinary failed');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          setTimeout(() => {
            callback(mockError, null);
          }, 0);
          return {
            end: mockEnd,
          };
        },
      );

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'Cloudinary failed',
      );
      expect(mockEnd).toHaveBeenCalledWith(mockFile.buffer);
    });
  });
});
