import { Test, TestingModule } from '@nestjs/testing';
import { PeerLendingController } from './peer-lending.controller';
import { PeerLendingService } from './peer-lending.service';

describe('PeerLendingController', () => {
  let controller: PeerLendingController;
  let service: PeerLendingService;

  const mockPeerLendingService = {
    findAllListings: jest.fn(),
    findMyListings: jest.fn(),
    findListing: jest.fn(),
    createListing: jest.fn(),
    removeListing: jest.fn(),
    findMyLoans: jest.fn(),
    requestLoan: jest.fn(),
    respondToLoan: jest.fn(),
    returnLoan: jest.fn(),
    rateLoan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeerLendingController],
      providers: [
        {
          provide: PeerLendingService,
          useValue: mockPeerLendingService,
        },
      ],
    }).compile();

    controller = module.get<PeerLendingController>(PeerLendingController);
    service = module.get<PeerLendingService>(PeerLendingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllListings should call service.findAllListings', async () => {
    mockPeerLendingService.findAllListings.mockResolvedValue([]);
    expect(await controller.findAllListings()).toEqual([]);
    expect(service.findAllListings).toHaveBeenCalled();
  });

  it('findMyListings should call service.findMyListings', async () => {
    const req = { user: { id: 'u1' } };
    mockPeerLendingService.findMyListings.mockResolvedValue([]);
    expect(await controller.findMyListings(req)).toEqual([]);
    expect(service.findMyListings).toHaveBeenCalledWith('u1');
  });

  it('findListing should call service.findListing', async () => {
    mockPeerLendingService.findListing.mockResolvedValue({ id: '1' });
    expect(await controller.findListing('1')).toEqual({ id: '1' });
    expect(service.findListing).toHaveBeenCalledWith('1');
  });

  it('createListing should call service.createListing', async () => {
    const req = { user: { id: 'u1' } };
    const dto = { title: 'Book' } as any;
    mockPeerLendingService.createListing.mockResolvedValue(dto);
    expect(await controller.createListing(dto, req)).toEqual(dto);
    expect(service.createListing).toHaveBeenCalledWith(dto, req.user);
  });

  it('removeListing should call service.removeListing', async () => {
    const req = { user: { id: 'u1' } };
    mockPeerLendingService.removeListing.mockResolvedValue({ deleted: true });
    expect(await controller.removeListing('1', req)).toEqual({ deleted: true });
    expect(service.removeListing).toHaveBeenCalledWith('1', req.user);
  });

  it('findMyLoans should call service.findMyLoans', async () => {
    const req = { user: { id: 'u1' } };
    mockPeerLendingService.findMyLoans.mockResolvedValue([]);
    expect(await controller.findMyLoans(req)).toEqual([]);
    expect(service.findMyLoans).toHaveBeenCalledWith('u1');
  });

  it('requestLoan should call service.requestLoan', async () => {
    const req = { user: { id: 'u1' } };
    const dto = { listingId: '1' } as any;
    mockPeerLendingService.requestLoan.mockResolvedValue(dto);
    expect(await controller.requestLoan(dto, req)).toEqual(dto);
    expect(service.requestLoan).toHaveBeenCalledWith(dto, req.user);
  });

  it('respondToLoan should call service.respondToLoan', async () => {
    const req = { user: { id: 'u1' } };
    mockPeerLendingService.respondToLoan.mockResolvedValue({ status: 'accepted' });
    expect(await controller.respondToLoan('1', 'accepted', req)).toEqual({ status: 'accepted' });
    expect(service.respondToLoan).toHaveBeenCalledWith('1', 'accepted', req.user);
  });

  it('returnLoan should call service.returnLoan', async () => {
    const req = { user: { id: 'u1' } };
    mockPeerLendingService.returnLoan.mockResolvedValue({ status: 'returned' });
    expect(await controller.returnLoan('1', req)).toEqual({ status: 'returned' });
    expect(service.returnLoan).toHaveBeenCalledWith('1', req.user);
  });

  it('rateLoan should call service.rateLoan', async () => {
    const req = { user: { id: 'u1' } };
    const dto = { rating: 5 } as any;
    mockPeerLendingService.rateLoan.mockResolvedValue({ rated: true });
    expect(await controller.rateLoan('1', dto, req)).toEqual({ rated: true });
    expect(service.rateLoan).toHaveBeenCalledWith('1', dto, req.user);
  });
});
