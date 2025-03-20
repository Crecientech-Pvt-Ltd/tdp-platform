import { Field, ObjectType } from "@nestjs/graphql";
import { GeneBase, GeneInteraction } from ".";

@ObjectType()
export class GeneInteractionOutput {
	@Field(() => [GeneBase])
	genes: GeneBase[];

	@Field(() => [GeneInteraction], { nullable: true })
	links: GeneInteraction[];

	@Field(() => String, { nullable: true })
	graphName?: string;
}
