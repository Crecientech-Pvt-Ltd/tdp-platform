export const NEO4J_CONFIG: string = "NEO4J_CONFIG";
export const NEO4J_DRIVER: string = "NEO4J_DRIVER";

export const GET_HEADERS_QUERY = (bringCommon = true) =>
	`${bringCommon ? "MATCH (cp:Common&Property) WITH COLLECT(cp { .* }) AS commonHeader" : ""}
  MATCH (:Disease { name: $disease })-[:HAS_PROPERTY]-(dp:Property)
  RETURN COLLECT( dp { .* }) AS diseaseHeader ${bringCommon ? ", commonHeader" : ""}`;

// MATCH (cp:Common&Property) WITH COLLECT(cp { .* })[0..5] AS common MATCH (dp:Property&!Common) RETURN COLLECT( dp { .* })[0..5] AS disease, common;

export function GET_GENES_QUERY(
	properties?: string[],
	bringMeta = true,
): string {
	if (properties?.length) {
		return `MATCH (g:Gene)
    WHERE g.ID IN $geneIDs OR g.Gene_name IN $geneIDs
    RETURN g { ${properties ? `${properties.map((prop) => `.\`${prop}\``).join(", ")},` : ""} ${bringMeta ? ".Gene_name, .Description, .hgnc_gene_id, .Aliases," : ""} .ID } AS genes`;
	}
	return `MATCH (g:Gene)
    WHERE g.ID IN $geneIDs OR g.Gene_name IN $geneIDs
    RETURN g { Input: g.Gene_name, Gene_name: g.Gene_name, Description: g.Description, hgnc_gene_id: g.hgnc_gene_id, ID: g.ID, Aliases: g.Aliases } AS genes
    UNION ALL
    MATCH (a:GeneAlias)-[:ALIAS_OF]->(g:Gene)
    WHERE a.Gene_name IN $geneIDs
    RETURN g { Input: a.Gene_name, Gene_name: g.Gene_name, Description: g.Description, hgnc_gene_id: g.hgnc_gene_id, ID: g.ID, Aliases: g.Aliases } AS genes`;
}

export function GENE_INTERACTIONS_QUERY(
	order: number,
	interactionType: string,
	graphExists = true,
): string {
	switch (order) {
		case 0:
			return `MATCH (g1:Gene) WHERE g1.ID IN $geneIDs
        OPTIONAL MATCH (g1:Gene)-[r:${interactionType}]->(g2:Gene)
        WHERE r.score >= $minScore AND elementId(g1) < elementId(g2) AND g2.ID IN $geneIDs
        WITH [conn IN COLLECT({gene1: g1.ID, gene2: g2.ID, score: r.score}) WHERE conn.gene2 IS NOT NULL] AS links, apoc.coll.toSet(COLLECT(g1 { .ID, .Gene_name, .Description})) AS genes
        ${graphExists ? "" : ",gds.graph.project($graphName,g1,g2,{ relationshipProperties: r { .score }, relationshipType: type(r) }, { undirectedRelationshipTypes: ['*'] }) AS graph"}
        RETURN genes, links
        `;
		case 1:
			return `MATCH (g1:Gene)-[r:${interactionType}]->(g2:Gene)
        WHERE g1.ID IN $geneIDs
        AND r.score >= $minScore
        WITH apoc.coll.toSet(COLLECT(g1 { .ID, .Gene_name, .Description}) + COLLECT(g2 { .ID, .Gene_name, .Description})) AS _genes, COLLECT({gene1: g1.ID, gene2: g2.ID, score: r.score}) AS _links
        ${graphExists ? "" : ",gds.graph.project($graphName,g1,g2,{ relationshipProperties: r { .score }, relationshipType: type(r) }, { undirectedRelationshipTypes: ['*'] }) AS graph"}
        RETURN _genes[0..${process.env.NODES_LIMIT || 5000}] AS genes, _links[0..${process.env.EDGES_LIMIT || 10000}] AS links
        `;
		default:
			return "";
	}
}

export function FIRST_ORDER_GENES_QUERY(interactionType: string): string {
	return `MATCH (g1:Gene)-[r:${interactionType}]->(g2:Gene)
    WHERE g1.ID IN $geneIDs AND r.score >= $minScore
    WITH apoc.coll.toSet(COLLECT(g1.ID) + COLLECT(g2.ID)) AS _geneIDs
    RETURN _geneIDs[0..${process.env.NODES_LIMIT || 5000}] AS geneIDs`;
}

export const GRAPH_DROP_QUERY = "CALL gds.graph.drop($graphName)";
export function LEIDEN_QUERY(
	minCommunitySize: number,
	weighted = true,
): string {
	return `CALL gds.leiden.stream($graphName, { ${weighted ? 'relationshipWeightProperty: "score",' : ""} gamma: $resolution, minCommunitySize: ${minCommunitySize}, logProgress: false }) YIELD nodeId, communityId RETURN gds.util.asNode(nodeId).ID AS ID, communityId AS community`;
}

export function RENEW_QUERY(order: number, interactionType: string) {
	switch (order) {
		case 0:
			return `MATCH (g1:Gene) WHERE g1.ID IN $geneIDs
        OPTIONAL MATCH (g1:Gene)-[r:${interactionType}]->(g2:Gene)
        WHERE r.score >= $minScore AND elementId(g1) < elementId(g2) AND g2.ID IN $geneIDs
        WITH gds.graph.project($graphName,g1,g2,{ relationshipProperties: r { .score }, relationshipType: type(r) }, { undirectedRelationshipTypes: ['*'] }) AS graph
        FINISH
        `;
		case 1:
			return `MATCH (g1:Gene)-[r:${interactionType}]->(g2:Gene)
        WHERE g1.ID IN $geneIDs
        AND r.score >= $minScore
        WITH gds.graph.project($graphName,g1,g2,{ relationshipProperties: r { .score }, relationshipType: type(r) }, { undirectedRelationshipTypes: ['*'] }) AS graph
        FINISH
        `;
		default:
			return "";
	}
}
