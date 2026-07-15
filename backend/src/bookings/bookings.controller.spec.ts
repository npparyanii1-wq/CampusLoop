import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBookingsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    processReturn: jest.fn(),
    confirmInspection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should call service.findAll', async () => {
    const req = { user: { id: 'u1' } };
    mockBookingsService.findAll.mockResolvedValue([]);
    expect(await controller.findAll(req)).toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith(req.user);
  });

  it('findOne should call service.findOne', async () => {
    const req = { user: { id: 'u1' } };
    mockBookingsService.findOne.mockResolvedValue({ id: '1' });
    expect(await controller.findOne('1', req)).toEqual({ id: '1' });
    expect(service.findOne).toHaveBeenCalledWith('1', req.user);
  });

  it('create should call service.create', async () => {
    const req = { user: { id: 'u1' } };
    const dto = { assetId: 'a1', startTime: 't1', endTime: 't2' } as any;
    mockBookingsService.create.mockResolvedValue(dto);
    expect(await controller.create(dto, req)).toEqual(dto);
    expect(service.create).toHaveBeenCalledWith(dto, req.user);
  });

  it('updateStatus should call service.updateStatus', async () => {
    const req = { user: { id: 'u1' } };
    mockBookingsService.updateStatus.mockResolvedValue({ status: 'approved' });
    expect(await controller.updateStatus('1', 'approved', 'ok', req)).toEqual({ status: 'approved' });
    expect(service.updateStatus).toHaveBeenCalledWith('1', 'approved', 'ok', req.user);
  });

  it('processReturn should call service.processReturn', async () => {
    const req = { user: { id: 'u1' } };
    const dto = { description: 'clean' } as any;
    mockBookingsService.processReturn.mockResolvedValue({ processed: true });
    expect(await controller.processReturn('1', dto, req)).toEqual({ processed: true });
    expect(service.processReturn).toHaveBeenCalledWith('1', dto, req.user);
  });

  it('confirmInspection should call service.confirmInspection', async () => {
    const req = { user: { id: 'u1' } };
    const dto = { condition: 'good' } as any;
    mockBookingsService.confirmInspection.mockResolvedValue({ inspected: true });
    expect(await controller.confirmInspection('1', dto, req)).toEqual({ inspected: true });
    expect(service.confirmInspection).toHaveBeenCalledWith('1', dto, req.user);
  });
});
