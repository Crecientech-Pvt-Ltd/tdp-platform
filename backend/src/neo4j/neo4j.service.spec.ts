import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from './neo4j.service';
import type { Driver, Session, SessionMode } from 'neo4j-driver';

describe('Neo4jService', () => {
  let service: Neo4jService;
  let driver: Driver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Neo4jService,
        {
          provide: 'NEO4J_CONFIG',
          useValue: {
            database: 'test-database',
          },
        },
        {
          provide: 'NEO4J_DRIVER',
          useValue: {
            getServerInfo: jest.fn(),
            close: jest.fn(),
            session: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<Neo4jService>(Neo4jService);
    driver = module.get<Driver>('NEO4J_DRIVER');
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize the driver and log a message on module initialization', async () => {
    const loggerSpy = jest.spyOn(service['logger'], 'log');
    await service.onModuleInit();
    expect(driver.getServerInfo).toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith('Connected to Neo4j');
  });

  it('should close the driver on module destruction', async () => {
    await service.onModuleDestroy();
    expect(driver.close).toHaveBeenCalled();
  });

  it('should return a session with the specified mode', () => {
    const sessionMode: SessionMode = 'READ';
    const session: Session = service.getSession(sessionMode);
    expect(driver.session).toHaveBeenCalledWith({
      database: 'test-database',
      defaultAccessMode: sessionMode,
    });
    expect(session).toBeDefined();
  });
});
