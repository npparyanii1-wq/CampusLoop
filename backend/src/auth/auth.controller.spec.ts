import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    getUserProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login should call authService.login', async () => {
    const dto = { email: 'test@test.com', password: 'password' };
    const result = { access_token: 'token' };
    mockAuthService.login.mockResolvedValue(result);

    expect(await controller.login(dto)).toBe(result);
    expect(service.login).toHaveBeenCalledWith(dto);
  });

  it('register should call authService.register', async () => {
    const dto = { email: 'test@test.com', password: 'password', name: 'Test User' } as any;
    const result = { id: '1', email: 'test@test.com' };
    mockAuthService.register.mockResolvedValue(result);

    expect(await controller.register(dto)).toBe(result);
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('getProfile should call authService.getUserProfile and exclude passwordHash', async () => {
    const req = { user: { id: '1' } };
    const userProfile = { id: '1', name: 'Test', passwordHash: 'secret' };
    mockAuthService.getUserProfile.mockResolvedValue(userProfile);

    const result = await controller.getProfile(req);
    expect(result).toEqual({ id: '1', name: 'Test' });
    expect(service.getUserProfile).toHaveBeenCalledWith('1');
  });
});
