import { Test, TestingModule } from '@nestjs/testing';
import { GqlResolver } from './gql.resolver';

describe('GqlResolver', () => {
  let resolver: GqlResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GqlResolver],
    }).compile();

    resolver = module.get<GqlResolver>(GqlResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('sayHello', () => {
    it('should return "Hello World!"', async () => {
      const result = await resolver.sayHello();
      expect(result).toBe('Hello World!');
    });
  });
});
