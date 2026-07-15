import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getMetrics: jest.fn(),
    getAnomalyReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMetrics should call service.getMetrics', async () => {
    mockAnalyticsService.getMetrics.mockResolvedValue({});
    expect(await controller.getMetrics()).toEqual({});
    expect(service.getMetrics).toHaveBeenCalled();
  });

  it('getAnomalyReport should call service.getAnomalyReport', async () => {
    mockAnalyticsService.getAnomalyReport.mockResolvedValue({});
    expect(await controller.getAnomalyReport()).toEqual({});
    expect(service.getAnomalyReport).toHaveBeenCalled();
  });
});
