import { Test, TestingModule } from '@nestjs/testing';
import { LostFoundController } from './lost-found.controller';
import { LostFoundService } from './lost-found.service';

describe('LostFoundController', () => {
  let controller: LostFoundController;
  let service: LostFoundService;

  const mockLostFoundService = {
    findAll: jest.fn(),
    getAiMatches: jest.fn(),
    findOne: jest.fn(),
    reportItem: jest.fn(),
    updateStatus: jest.fn(),
    linkAndClaim: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LostFoundController],
      providers: [
        {
          provide: LostFoundService,
          useValue: mockLostFoundService,
        },
      ],
    }).compile();

    controller = module.get<LostFoundController>(LostFoundController);
    service = module.get<LostFoundService>(LostFoundService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should call service.findAll', async () => {
    mockLostFoundService.findAll.mockResolvedValue([]);
    expect(await controller.findAll('lost')).toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith('lost');
  });

  it('getAiMatches should call service.getAiMatches', async () => {
    mockLostFoundService.getAiMatches.mockResolvedValue([]);
    expect(await controller.getAiMatches()).toEqual([]);
    expect(service.getAiMatches).toHaveBeenCalled();
  });

  it('findOne should call service.findOne', async () => {
    mockLostFoundService.findOne.mockResolvedValue({ id: '1' });
    expect(await controller.findOne('1')).toEqual({ id: '1' });
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('reportItem should call service.reportItem', async () => {
    const req = { user: { id: 'u1' } };
    const dto = { name: 'Keys' } as any;
    mockLostFoundService.reportItem.mockResolvedValue(dto);
    expect(await controller.reportItem(dto, req)).toEqual(dto);
    expect(service.reportItem).toHaveBeenCalledWith(dto, req.user);
  });

  it('updateStatus should call service.updateStatus', async () => {
    const req = { user: { id: 'u1' } };
    mockLostFoundService.updateStatus.mockResolvedValue({ status: 'claimed' });
    expect(await controller.updateStatus('1', 'claimed', req)).toEqual({ status: 'claimed' });
    expect(service.updateStatus).toHaveBeenCalledWith('1', 'claimed', req.user);
  });

  it('linkAndClaim should call service.linkAndClaim', async () => {
    const req = { user: { id: 'u1' } };
    mockLostFoundService.linkAndClaim.mockResolvedValue({ linked: true });
    expect(await controller.linkAndClaim('l1', 'f1', req)).toEqual({ linked: true });
    expect(service.linkAndClaim).toHaveBeenCalledWith('l1', 'f1', req.user);
  });
});
