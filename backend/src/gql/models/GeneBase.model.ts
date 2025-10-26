import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GeneBase {
  @Field(() => String)
  ID: string;

  @Field(() => String, { nullable: true })
  Description?: string;

  @Field(() => String, { nullable: true })
  Gene_name?: string;
}

@ObjectType()
export class TopGene {
  @Field()
  gene_name: string;
}
