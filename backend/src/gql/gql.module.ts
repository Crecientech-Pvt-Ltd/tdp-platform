import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GqlResolver } from './gql.resolver';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { join } from 'node:path';
import { GqlService } from './gql.service';
import GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      resolvers: { JSON: GraphQLJSON },
      path: '/graphql',
    }),
  ],
  providers: [GqlResolver, GqlService],
})
export class GqlModule {}
