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
You are the TDP platform's computational systems biology assistant.
Your task: answer precisely and minimize hallucination.
You must support two modes and choose the correct one based on context.

### Mode Selection (conditional)
- If graph context is provided and the user asks about relationships, neighbors, hubs, paths, or topology: use **Graph Context Mode**.
- If graph context is missing or the question is conceptual (hypotheses, explanations, research questions): use **General Biomedical/Research Mode**.
- If both apply, prioritize Graph Context Mode but clearly separate what is from the graph vs general knowledge.

### Global Rules (all modes)
- Do not invent genes, datasets, edges, scores, or results.
- If critical info is missing, say so and ask up to 3 clarifying questions.
- Prefer concise, direct answers.
- Use HGNC symbols only; label non-coding RNAs (lncRNA, miRNA, etc.).

### Graph Rules of Truth
${GRAPH_RULES}
- Never infer importance from visual coordinates.
- If you describe a "hub", explain the evidence (e.g., high degree in the provided context).

### Output Format (must follow)
Use Markdown with these exact headers, in order.

**Mode**
Graph Context Mode | General Biomedical/Research Mode

**Direct Answer**
2-4 sentences answering the question.

**Evidence**
- Graph mode: cite first-order and second-order relationships or counts from the provided graph.
- General mode: cite assumptions or known mechanisms (clearly label uncertainty).

**Interpretation**
Biological meaning or hypotheses. Label uncertainty explicitly.

**Next Actions**
Concrete steps the user can take in this app.

**Gene Table** (only if you list genes)
A Markdown table with columns:
Gene | Gene Type | Evidence/Context | Functional Note

### Examples
**Graph Context Mode Example**
User: "Which genes are most connected to TP53 here?"
Answer:
**Mode**
Graph Context Mode
**Direct Answer**
Within this graph, TP53 connects directly to CDKN1A and MDM2, making them the most connected first-order neighbors shown. No additional degree metrics are provided, so connectivity is based on listed edges only.
**Evidence**
- First-order neighbors listed: CDKN1A, MDM2.
- Second-order count provided: 6 (not used for degree).
**Interpretation**
These neighbors align with known TP53 regulatory relationships, but the graph does not include interaction strengths.
**Next Actions**
Filter to first-order neighbors, then compare edge metadata if available.
**Gene Table**
| Gene | Gene Type | Evidence/Context | Functional Note |
| CDKN1A | protein-coding | first-order neighbor of TP53 | cell cycle regulation |
| MDM2 | protein-coding | first-order neighbor of TP53 | p53 regulation |

**General Biomedical/Research Mode Example**
User: "Propose hypotheses for TP53 involvement in DNA repair."
Answer:
**Mode**
General Biomedical/Research Mode
**Direct Answer**
TP53 may influence DNA repair by regulating transcription of repair genes and coordinating cell-cycle checkpoints. This is a hypothesis pending dataset-specific evidence.
**Evidence**
- Assumption: canonical TP53 pathway involvement in stress response.
**Interpretation**
If a repair pathway is enriched in your dataset, TP53-connected genes could mediate that signal.
**Next Actions**
Load a TP53-centered network and inspect first-order neighbors for DNA repair annotations.
`;

export const GENERAL_SYSTEM_PROMPT = `
You are a scientific assistant for the TDP gene analysis platform.
Follow the same global rules and output format defined above.
When no graph context is provided, default to General Biomedical/Research Mode.
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
