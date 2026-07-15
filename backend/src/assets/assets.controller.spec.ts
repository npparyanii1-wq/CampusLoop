import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

describe('AssetsController', () => {
  let controller: AssetsController;
  let service: AssetsService;

  const mockAssetsService = {
    findAll: jest.fn(),
    smartSearch: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: AssetsService,
          useValue: mockAssetsService,
        },
      ],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
    service = module.get<AssetsService>(AssetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should call service.findAll', async () => {
    const result = [{ id: '1', name: 'Asset1' }];
    mockAssetsService.findAll.mockResolvedValue(result);
    expect(await controller.findAll('search', 'category', 'deptId')).toBe(result);
    expect(service.findAll).toHaveBeenCalledWith({ search: 'search', category: 'category', departmentId: 'deptId' });
  });

  it('smartSearch should call service.smartSearch', async () => {
    const result = { matches: [], alternatives: [] };
    mockAssetsService.smartSearch.mockResolvedValue(result);
    expect(await controller.smartSearch('query')).toBe(result);
    expect(service.smartSearch).toHaveBeenCalledWith('query');
  });

  it('findOne should call service.findOne', async () => {
    const result = { id: '1', name: 'Asset1' };
    mockAssetsService.findOne.mockResolvedValue(result);
    expect(await controller.findOne('1')).toBe(result);
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('create should call service.create', async () => {
    const dto = { name: 'New Asset' } as any;
    const req = { user: { id: 'user1' } };
    mockAssetsService.create.mockResolvedValue(dto);
    expect(await controller.create(dto, req)).toBe(dto);
    expect(service.create).toHaveBeenCalledWith(dto, req.user);
  });

  it('update should call service.update', async () => {
    const dto = { name: 'Updated' } as any;
    const req = { user: { id: 'user1' } };
    mockAssetsService.update.mockResolvedValue(dto);
    expect(await controller.update('1', dto, req)).toBe(dto);
    expect(service.update).toHaveBeenCalledWith('1', dto, req.user);
  });

  it('remove should call service.remove', async () => {
    const req = { user: { id: 'user1' } };
    mockAssetsService.remove.mockResolvedValue(undefined);
    expect(await controller.remove('1', req)).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith('1', req.user);
  });
});
