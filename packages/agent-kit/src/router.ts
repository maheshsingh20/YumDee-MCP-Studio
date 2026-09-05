/**
 * @yumdee/mcp-studio-agent-kit - Semantic Tool Router
 *
 * Dynamic tool retrieval & context pruning using vector embeddings and cosine similarity.
 * Drastically reduces context window bloat and eliminates tool hallucination
 * in multi-server MCP environments with 50+ tools.
 */

import { ToolDefinition } from "@yumdee/mcp-studio-core";

export interface SemanticRouterConfig {
  /** Maximum number of tools to select for any given turn (default: 3) */
  topK?: number;
  /** Minimum similarity score threshold between 0 and 1 (default: 0.1) */
  minScore?: number;
  /** Optional custom embedding function (e.g. OpenAI text-embedding-3-small, Ollama nomic-embed-text) */
  embedFn?: (text: string) => Promise<number[]>;
}

export interface RouteResult<T = ToolDefinition> {
  selectedTools: T[];
  scores: Array<{ toolName: string; score: number }>;
  metrics: {
    totalTools: number;
    selectedCount: number;
    prunedCount: number;
    estimatedTokensBefore: number;
    estimatedTokensAfter: number;
    tokensSaved: number;
    reductionPercentage: number;
  };
}

/**
 * Fast cosine similarity between two dense vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

/**
 * Built-in Sub-word & N-Gram Sparse Vectorizer
 * High-speed, zero-dependency semantic vectorizer robust to typos,
 * snake_case/camelCase function identifiers, and terminology variations.
 */
export class SparseSemanticVectorizer {
  private vocabulary: Map<string, number> = new Map();
  private docFrequencies: Map<string, number> = new Map();
  private docCount: number = 0;

  /**
   * Tokenize and normalize text into word stems and character 3-grams
   */
  tokenize(text: string): string[] {
    const tokens: string[] = [];
    // Split camelCase, snake_case, kebab-case, punctuation
    const words = text
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    for (const word of words) {
      tokens.push(word);
      // Generate character 3-grams for subword matching
      if (word.length >= 3) {
        for (let i = 0; i <= word.length - 3; i++) {
          tokens.push(`__ng_${word.slice(i, i + 3)}`);
        }
      }
    }
    return tokens;
  }

  /**
   * Build TF-IDF vocabulary across all documents
   */
  fit(documents: string[]): void {
    this.vocabulary.clear();
    this.docFrequencies.clear();
    this.docCount = documents.length;

    let nextIndex = 0;
    for (const doc of documents) {
      const tokens = new Set(this.tokenize(doc));
      for (const token of tokens) {
        if (!this.vocabulary.has(token)) {
          this.vocabulary.set(token, nextIndex++);
        }
        this.docFrequencies.set(token, (this.docFrequencies.get(token) || 0) + 1);
      }
    }
  }

  /**
   * Transform text into a normalized TF-IDF vector
   */
  transform(text: string): number[] {
    const vector = new Array(this.vocabulary.size).fill(0);
    const tokens = this.tokenize(text);
    if (tokens.length === 0 || this.vocabulary.size === 0) return vector;

    const termCounts: Map<string, number> = new Map();
    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    }

    let normSq = 0;
    for (const [token, count] of termCounts) {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        const tf = count / tokens.length;
        const df = this.docFrequencies.get(token) || 1;
        const idf = Math.log((this.docCount + 1) / df) + 1;
        const tfidf = tf * idf;
        vector[idx] = tfidf;
        normSq += tfidf * tfidf;
      }
    }

    // L2 Normalize
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }
}

/**
 * Semantic Tool Router
 */
export class SemanticToolRouter<T extends { name: string; description?: string; inputSchema?: any } = ToolDefinition> {
  private config: Required<Pick<SemanticRouterConfig, "topK" | "minScore">> & {
    embedFn?: (text: string) => Promise<number[]>;
  };
  private vectorizer: SparseSemanticVectorizer = new SparseSemanticVectorizer();
  private indexedTools: Array<{
    tool: T;
    text: string;
    vector?: number[];
  }> = [];

  constructor(config: SemanticRouterConfig = {}) {
    this.config = {
      topK: config.topK ?? 3,
      minScore: config.minScore ?? 0.08,
      embedFn: config.embedFn,
    };
  }

  /**
   * Convert a tool definition into rich textual signature for vectorization
   */
  static extractToolSignature(tool: { name: string; description?: string; inputSchema?: any }): string {
    const parts: string[] = [tool.name, tool.description || ""];
    const schema = tool.inputSchema;
    if (schema && typeof schema === "object") {
      if (schema.properties && typeof schema.properties === "object") {
        for (const [key, prop] of Object.entries<any>(schema.properties)) {
          parts.push(key);
          if (prop?.description) parts.push(prop.description);
          if (prop?.type) parts.push(prop.type);
        }
      }
      if (Array.isArray(schema.required)) {
        parts.push(schema.required.join(" "));
      }
    }
    return parts.join(" ");
  }

  /**
   * Index all tools and build vector space representations
   */
  async indexTools(tools: T[]): Promise<void> {
    this.indexedTools = [];
    const documents: string[] = [];

    for (const tool of tools) {
      const signature = SemanticToolRouter.extractToolSignature(tool);
      this.indexedTools.push({ tool, text: signature });
      documents.push(signature);
    }

    if (this.config.embedFn) {
      for (const item of this.indexedTools) {
        item.vector = await this.config.embedFn(item.text);
      }
    } else {
      this.vectorizer.fit(documents);
      for (const item of this.indexedTools) {
        item.vector = this.vectorizer.transform(item.text);
      }
    }
  }

  /**
   * Semantically route a user query to the top-K relevant tools
   */
  async route(query: string, options?: { topK?: number; minScore?: number }): Promise<RouteResult<T>> {
    const topK = options?.topK ?? this.config.topK;
    const minScore = options?.minScore ?? this.config.minScore;

    if (this.indexedTools.length === 0) {
      return {
        selectedTools: [],
        scores: [],
        metrics: {
          totalTools: 0,
          selectedCount: 0,
          prunedCount: 0,
          estimatedTokensBefore: 0,
          estimatedTokensAfter: 0,
          tokensSaved: 0,
          reductionPercentage: 0,
        },
      };
    }

    // Compute query vector
    const queryVector = this.config.embedFn
      ? await this.config.embedFn(query)
      : this.vectorizer.transform(query);

    // Score all tools
    const scored = this.indexedTools.map((item) => {
      const score = item.vector ? cosineSimilarity(queryVector, item.vector) : 0;
      return { tool: item.tool, toolName: item.tool.name, score };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Filter by threshold and take top-K
    let selected = scored.filter((item) => item.score >= minScore).slice(0, topK);

    // Fallback: If no tools pass the threshold, return the single highest scoring tool if score > 0
    if (selected.length === 0 && scored.length > 0 && scored[0].score > 0) {
      selected = [scored[0]];
    }

    // If still empty (e.g. zero similarity everywhere), keep top-1 as safety fallback
    if (selected.length === 0 && scored.length > 0) {
      selected = [scored[0]];
    }

    // Estimate token metrics (approx 150 tokens per tool schema definition in JSON)
    const tokensPerTool = 180;
    const estimatedTokensBefore = this.indexedTools.length * tokensPerTool;
    const estimatedTokensAfter = selected.length * tokensPerTool;
    const tokensSaved = Math.max(0, estimatedTokensBefore - estimatedTokensAfter);
    const reductionPercentage =
      estimatedTokensBefore > 0
        ? Math.round((tokensSaved / estimatedTokensBefore) * 100)
        : 0;

    return {
      selectedTools: selected.map((s) => s.tool),
      scores: scored.map((s) => ({ toolName: s.toolName, score: Math.round(s.score * 1000) / 1000 })),
      metrics: {
        totalTools: this.indexedTools.length,
        selectedCount: selected.length,
        prunedCount: this.indexedTools.length - selected.length,
        estimatedTokensBefore,
        estimatedTokensAfter,
        tokensSaved,
        reductionPercentage,
      },
    };
  }
}
