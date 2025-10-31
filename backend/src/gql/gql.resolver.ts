import { RedisService } from '@/redis/redis.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Context, Info, Int, Query, Resolver } from '@nestjs/graphql';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { Kind, type GraphQLResolveInfo } from 'graphql';
import { GqlService } from './gql.service';
import { GeneInteractionOutput, GeneMetadata, Headers, InteractionInput } from './models';

@Resolver('gql')
export class GqlResolver {
  constructor(
    private readonly gqlService: GqlService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @Query(() => [GeneMetadata])
  async genes(@Args('geneIDs', { type: () => [String] }) geneIDs: string[]): Promise<GeneMetadata[]> {
    return this.gqlService.getGenes(geneIDs);
  }

  @Query(() => Headers)
  async headers(
    @Args('diseaseId', { type: () => String }) diseaseId: string,
    @Info() info: GraphQLResolveInfo,
  ): Promise<Headers> {
    const key = `headers:common`;
    let result: Headers | null = null;
    const cached = await this.redisService.redisClient.get(key);
    if (cached) {
      result = JSON.parse(cached) as Headers;
      const isDbQueryNeeded =
        info.fieldNodes[0].selectionSet?.selections.find(
          (val) => val.kind === Kind.FIELD && ['differentialExpression', 'genetics'].includes(val.name.value),
        ) !== undefined;
      if (isDbQueryNeeded === false) return result;
    }
    result = await this.gqlService.getHeaders(diseaseId, result);
    await this.redisService.redisClient.set(key, JSON.stringify(result), 'EX', 86400);
    return result;
  }

  @Query(() => GeneInteractionOutput)
  async getGeneInteractions(
    @Args('input', { type: () => InteractionInput }) input: InteractionInput,
    @Args('order', { type: () => Int }) order: number,
    @Context('req') req: Request,
  ): Promise<GeneInteractionOutput> {
    const userID: string = req.cookies['user-id'] ?? crypto.randomUUID();
    if (!isUUID(userID)) throw new HttpException('Correct user ID not found', HttpStatus.UNAUTHORIZED);
    if (!req.cookies['user-id']) {
      await this.redisService.redisClient.set(
        `user:${userID}`,
        '',
        'EX',
        this.configService.get('REDIS_USER_EXPIRY', 7200),
      );

      req.res?.cookie('user-id', userID, {
        maxAge: this.configService.get('REDIS_USER_EXPIRY', 7200) * 1000,
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV', '') !== 'production',
        sameSite: ['testing', 'production'].includes(this.configService.get<string>('NODE_ENV', ''))
          ? 'strict'
          : 'none',
      });
    }
    const graphName =
      input.graphName ??
      this.gqlService.computeHash(
        JSON.stringify({
          ...input,
          geneIDs: input.geneIDs.sort(),
          order,
        }),
      );
    const result = await this.gqlService.getGeneInteractions(input, order, graphName, userID);
    return {
      genes: result.genes,
      links: result.links,
      graphName,
    };
  }
}
