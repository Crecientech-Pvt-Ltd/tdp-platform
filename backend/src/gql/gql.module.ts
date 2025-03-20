import { join } from "node:path";
import { ApolloDriver } from "@nestjs/apollo";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";
import { GqlResolver } from "./gql.resolver";
import { GqlService } from "./gql.service";

@Module({
	imports: [
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			autoSchemaFile: join(process.cwd(), "src/schema.gql"),
			sortSchema: true,
			resolvers: { JSON: GraphQLJSON },
			path: "/graphql",
		}),
	],
	providers: [GqlResolver, GqlService],
})
export class GqlModule {}
