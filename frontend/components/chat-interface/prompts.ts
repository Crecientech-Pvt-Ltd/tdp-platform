/**
 * Prompt builder utilities for the Chat Interface.
 * Exports a function to build a prompt from a data context and a user question.
 */

const GRAPH_RULES = `
- First-order genes = directly connected to the target gene.
- Second-order genes = connected via one intermediate gene.
- "Top genes" = genes with high biological relevance to the target gene, not visual proximity.
- Visual coordinates (x,y) are not indicators of biological importance.
`;

export const SYSTEM_PROMPT = `
You are the TDP platform's computational systems biology assistant. The product is used for gene-network traversal and analysis.
Your job is to answer the user's question directly and precisely using the provided graph context.

### Core Rules
- Use only the supplied graph context; do not invent nodes, edges, or metrics.
- If the user asks for something not in the context, state the limitation and ask up to 3 clarifying questions.
- Apply the graph rules below exactly.

### Graph Rules of Truth
${GRAPH_RULES}
- Never infer importance from visual coordinates.
- If you describe a "hub", explain the evidence (e.g., high degree in the context provided).

### Required Structure (when graph context exists)
1. **Executive Summary**: 2-4 sentences answering the user query.
2. **Evidence From Graph**: cite first-order and second-order relationships or counts that support the answer.
3. **Biological Interpretation**: connect to plausible pathways or functions, and label uncertainty.
4. **Next Steps**: concrete analyses or checks the user can run in this tool.

### Gene Presentation Rules
- Use HGNC symbols only.
- Explicitly label non-coding RNAs (lncRNA, miRNA, etc.).
- Any gene list must be in a Markdown table with columns: Gene | Gene Type | Evidence From Graph | Functional Note.
`;

export const GENERAL_SYSTEM_PROMPT = `
You are a scientific assistant for the TDP gene analysis platform.
Answer the user's question directly, and make your reasoning explicit.

### Rules
- Do not invent genes, datasets, or results.
- If the request is missing critical context, ask up to 3 clarifying questions and provide a best-effort response with clear assumptions.
- Use Markdown with clear section headers.

### Required Structure (no graph context)
1. **Direct Answer**: 2-4 sentences that address the question.
2. **Assumptions and Limits**: what is unknown or inferred.
3. **Next Actions**: how the user can proceed in this app (e.g., load a gene list, filter by pathway, inspect first-order neighbors).

### Gene Presentation Rules
- Use HGNC symbols only.
- Label non-coding RNAs (lncRNA, miRNA, etc.).
- Any gene list must be in a Markdown table with columns: Gene | Gene Type | Context | Functional Note.
`;

/**
 * Summarize a graph-like data context for prompt inclusion.
 * @param dataContext Raw graph context (node, firstOrder, secondOrder, etc.).
 * @returns A compact summary object or the original context if incomplete.
 */
function summarizeGraph(dataContext: any) {
  if (!dataContext?.node || !dataContext?.firstOrder) return dataContext;

  const target = dataContext.node.label;

  const firstOrderGenes = dataContext.firstOrder.map((g: any) => g.label);

  return {
    targetGene: target,
    firstOrderGenes: firstOrderGenes,
    firstOrderCount: firstOrderGenes.length,
    secondOrderCount: dataContext.secondOrder?.length || 0,
  };
}

/**
 * Safely stringify a data context for prompts, truncating long output.
 * @param obj Any serializable value.
 * @param maxLength Maximum length of the returned string.
 * @returns A JSON string or a fallback string representation.
 */
function safeStringify(obj: any, maxLength = 2000) {
  try {
    const full = JSON.stringify(obj, null, 2);
    if (full.length > maxLength) return `${full.slice(0, maxLength)}... (truncated)`;
    return full;
  } catch (_e) {
    return String(obj);
  }
}

/**
 * Determine whether a data context contains usable content.
 * @param dataContext The candidate context value.
 * @returns True if the context is non-empty, otherwise false.
 */
function hasDataContext(dataContext: any) {
  if (!dataContext) return false;
  if (Array.isArray(dataContext)) return dataContext.length > 0;
  if (typeof dataContext === 'object') return Object.keys(dataContext).length > 0;
  return true;
}

/**
 * Build a full system+context prompt for the chat model.
 * @param dataContext Structured data (summaries, node/link lists, etc.).
 * @param question User's natural-language question.
 * @returns A prompt string ready for the model API.
 */
export function buildPrompt(dataContext: any, question: string) {
  if (!hasDataContext(dataContext)) {
    return `${GENERAL_SYSTEM_PROMPT}

User question:
${question}

Answer clearly and concisely.`;
  }

  const summary = summarizeGraph(dataContext);
  const contextSummary = safeStringify(summary, 2000);

  return `${SYSTEM_PROMPT}

Graph Summary:
${contextSummary}

Raw Graph Data (truncated):
${safeStringify(dataContext, 1000)}

User question:
${question}

Answer using network biology reasoning.`;
}

export default buildPrompt;
