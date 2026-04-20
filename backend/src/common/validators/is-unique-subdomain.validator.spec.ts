import { Test, TestingModule } from '@nestjs/testing';
import { IsUniqueSubdomainValidator } from './is-unique-subdomain.validator';
import { PrismaService } from '../../prisma/prisma.service';

describe('IsUniqueSubdomainValidator', () => {
  let validator: IsUniqueSubdomainValidator;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      project: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsUniqueSubdomainValidator,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    validator = module.get<IsUniqueSubdomainValidator>(IsUniqueSubdomainValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  describe('validate', () => {
    it('should allow unique subdomain with valid format', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      const result = await validator.validate('myproject123', {} as any);

      expect(result).toBe(true);
    });

    it('should reject existing subdomain', async () => {
      prismaService.project.findUnique.mockResolvedValue({ id: 'proj-1' });

      const result = await validator.validate('existing-sub', {} as any);

      expect(result).toBe(false);
    });

    it('should reject subdomain with uppercase', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      const result = await validator.validate('MyProject', {} as any);

      expect(result).toBe(false);
    });

    it('should reject subdomain with special chars', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      const result = await validator.validate('my_project!', {} as any);

      expect(result).toBe(false);
    });

    it('should reject subdomain with spaces', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      const result = await validator.validate('my project', {} as any);

      expect(result).toBe(false);
    });

    it('should allow hyphens in subdomain', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      const result = await validator.validate('my-project-123', {} as any);

      expect(result).toBe(true);
    });

    it('should allow empty subdomain (other validators handle)', async () => {
      const result = await validator.validate('', {} as any);

      expect(result).toBe(true);
      expect(prismaService.project.findUnique).not.toHaveBeenCalled();
    });

    it('should return error message', () => {
      const msg = validator.defaultMessage();

      expect(msg).toContain('unique');
      expect(msg).toContain('lowercase');
    });
  });
});
