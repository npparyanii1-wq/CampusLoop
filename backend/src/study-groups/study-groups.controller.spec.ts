import { Test, TestingModule } from '@nestjs/testing';
import { StudyGroupsController } from './study-groups.controller';
import { StudyGroupsService } from './study-groups.service';

describe('StudyGroupsController', () => {
  let controller: StudyGroupsController;
  let service: StudyGroupsService;

  const mockStudyGroupsService = {
    getMyInterests: jest.fn(),
    registerInterest: jest.fn(),
    findMatches: jest.fn(),
    sendInvite: jest.fn(),
    respondToInvite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyGroupsController],
      providers: [
        {
          provide: StudyGroupsService,
          useValue: mockStudyGroupsService,
        },
      ],
    }).compile();

    controller = module.get<StudyGroupsController>(StudyGroupsController);
    service = module.get<StudyGroupsService>(StudyGroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMyInterests should call service.getMyInterests', async () => {
    const req = { user: { id: 'u1' } };
    mockStudyGroupsService.getMyInterests.mockResolvedValue([]);
    expect(await controller.getMyInterests(req)).toEqual([]);
    expect(service.getMyInterests).toHaveBeenCalledWith('u1');
  });

  it('registerInterest should call service.registerInterest', async () => {
    const req = { user: { id: 'u1' } };
    const dto = { moduleCode: 'CS101' } as any;
    mockStudyGroupsService.registerInterest.mockResolvedValue(dto);
    expect(await controller.registerInterest(dto, req)).toEqual(dto);
    expect(service.registerInterest).toHaveBeenCalledWith(dto, req.user);
  });

  it('findMatches should call service.findMatches', async () => {
    const req = { user: { id: 'u1' } };
    mockStudyGroupsService.findMatches.mockResolvedValue([]);
    expect(await controller.findMatches('CS101', req)).toEqual([]);
    expect(service.findMatches).toHaveBeenCalledWith('CS101', req.user);
  });

  it('sendInvite should call service.sendInvite', async () => {
    const req = { user: { id: 'u1' } };
    mockStudyGroupsService.sendInvite.mockResolvedValue({ invited: true });
    expect(await controller.sendInvite('CS101', 'u2', req)).toEqual({ invited: true });
    expect(service.sendInvite).toHaveBeenCalledWith('CS101', 'u2', req.user);
  });

  it('respondToInvite should call service.respondToInvite', async () => {
    const req = { user: { id: 'u1' } };
    mockStudyGroupsService.respondToInvite.mockResolvedValue({ status: 'accepted' });
    expect(await controller.respondToInvite('CS101', 'u2', 'accepted', req)).toEqual({ status: 'accepted' });
    expect(service.respondToInvite).toHaveBeenCalledWith('CS101', 'u2', 'accepted', req.user);
  });
});
