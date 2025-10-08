import { ClickhouseModule } from '@/clickhouse/clickhouse.module';
import { DataLoaderModule } from '@/dataloader';
import { ApolloDriver } from '@/utils/apollo';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { join } from 'node:path';
import { ClickhouseResolver, TargetResolver } from './clickhouse.resolver';
import { GqlResolver } from './gql.resolver';
import { GqlService } from './gql.service';

@Module({
  imports: [
    GraphQLModule.forRootAsync({
      driver: ApolloDriver,
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        resolvers: { JSON: GraphQLJSON },
        path: '/graphql',
        playground: configService.get<string>('NODE_ENV', 'development') !== 'production',
      }),
      inject: [ConfigService],
    }),
    ClickhouseModule,
    DataLoaderModule,
  ],
  providers: [GqlResolver, ClickhouseResolver, TargetResolver, GqlService],
})
export class GqlModule {}
