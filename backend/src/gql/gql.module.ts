import { ClickhouseModule } from '@/clickhouse/clickhouse.module';
import { DataLoaderModule } from '@/dataloader';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { join } from 'node:path';
import { ClickhouseResolver, TargetResolver } from './clickhouse.resolver';
import { GqlResolver } from './gql.resolver';
import { GqlService } from './gql.service';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      resolvers: { JSON: GraphQLJSON },
      path: '/graphql',
    }),
    ClickhouseModule,
    DataLoaderModule,
  ],
  providers: [GqlResolver, ClickhouseResolver, TargetResolver, GqlService],
})
export class GqlModule {}
