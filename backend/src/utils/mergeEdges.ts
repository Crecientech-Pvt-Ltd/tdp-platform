export interface Edge {
  gene1: string;
  gene2: string;
  score: number;
  interactionType?: string;
  [key: string]: any;
}

export function mergeEdgesAndAverageScore(edges: Edge[], interactionTypes: string[]): Edge[] {
  const edgeMap = new Map<
    string,
    {
      totalScore: number;
      count: number;
      edge: Edge;
      typeScores: { [type: string]: number[] };
    }
  >();

  for (const edge of edges) {
    const key = edge.gene1 < edge.gene2 ? `${edge.gene1}|${edge.gene2}` : `${edge.gene2}|${edge.gene1}`;
    const type = edge.interactionType;

    if (!edgeMap.has(key)) {
      edgeMap.set(key, {
        totalScore: edge.score,
        count: 1,
        edge: { gene1: edge.gene1, gene2: edge.gene2, score: edge.score },
        typeScores: type ? { [type]: [edge.score] } : {},
      });
    } else {
      const entry = edgeMap.get(key)!;
      entry.totalScore += edge.score;
      entry.count += 1;
      if (type) {
        if (!entry.typeScores[type]) entry.typeScores[type] = [];
        entry.typeScores[type].push(edge.score);
      }
    }
  }

  return Array.from(edgeMap.values()).map(({ totalScore, count, edge, typeScores }) => {
    const result: any = { ...edge, score: totalScore / count };
    result.typeScores = {};
    for (const type of interactionTypes) {
      if (typeScores[type]) {
        result.typeScores[type] = typeScores[type].reduce((a, b) => a + b, 0) / typeScores[type].length;
      } else {
        result.typeScores[type] = null;
      }
    }
    return result;
  });
}
