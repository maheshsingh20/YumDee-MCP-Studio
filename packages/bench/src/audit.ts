/**
 * @yumdee/mcp-studio-bench - Automated MCP Security & Prompt Injection Auditor
 *
 * Scans MCP server tools, schemas, and descriptions for:
 * - Indirect Prompt Injection vectors
 * - Arbitrary Command Execution risks
 * - Directory Path Traversal vulnerabilities
 * - Unchecked destructive mutations
 * - Optional deep Gemini LLM vulnerability auditing
 */

export interface SecurityAuditIssue {
  id: string;
  toolName: string;
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "PROMPT_INJECTION"
    | "COMMAND_INJECTION"
    | "PATH_TRAVERSAL"
    | "DESTRUCTIVE_OPERATION"
    | "UNVALIDATED_INPUT";
  title: string;
  description: string;
  recommendation: string;
}

export interface SecurityAuditReport {
  overallScore: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "F";
  totalToolsScanned: number;
  issues: SecurityAuditIssue[];
  summary: string;
  timestamp: string;
  auditor: "gemini" | "static-rubric";
}

export interface SecurityAuditorOptions {
  apiKey?: string;
  model?: string;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*:\s*/i,
  /disregard\s+(the\s+)?(rules|instructions)/i,
  /you\s+are\s+now\s+in\s+(developer|dan|jailbreak)\s+mode/i,
  /reveal\s+(api\s*key|token|secret|password)/i,
  /<system>/i,
  /\[SYSTEM_INSTRUCTION\]/i,
  /exec\s+as\s+root/i,
];

const SHELL_PATTERNS = [/^(exec|eval|run_command|shell|bash|powershell|cmd)$/i];

const TRAVERSAL_PARAM_NAMES = ["path", "filepath", "filename", "dir", "file_path", "target_path"];

const DESTRUCTIVE_PREFIXES = ["delete", "remove", "drop", "destroy", "kill", "truncate", "purge", "rm"];

export class SecurityAuditor {
  private apiKey?: string;
  private model: string;

  constructor(options: SecurityAuditorOptions = {}) {
    this.apiKey = options.apiKey;
    this.model = options.model || "gemini-1.5-flash";
  }

  /**
   * Run full security audit on server tools
   */
  async auditTools(
    tools: Array<{ name: string; description?: string; inputSchema?: any }>
  ): Promise<SecurityAuditReport> {
    const issues: SecurityAuditIssue[] = [];

    // 1. Static Rubric Analysis
    for (const tool of tools) {
      const toolName = tool.name || "unknown";
      const desc = tool.description || "";
      const schema = tool.inputSchema || {};
      const properties = schema.properties || {};

      // A. Prompt Injection checks in tool description
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(desc) || pattern.test(toolName)) {
          issues.push({
            id: `PI-${toolName}-${Date.now()}`,
            toolName,
            severity: "critical",
            category: "PROMPT_INJECTION",
            title: "Potential Prompt Injection in Tool Metadata",
            description: `Tool description or name matches known instruction-override vector: ${pattern.toString()}`,
            recommendation:
              "Sanitize the tool description to clearly and concisely describe functionality without instruction-altering tokens.",
          });
          break;
        }
      }

      // B. Shell / Command Injection checks
      if (SHELL_PATTERNS.some((p) => p.test(toolName))) {
        issues.push({
          id: `CMD-${toolName}-${Date.now()}`,
          toolName,
          severity: "high",
          category: "COMMAND_INJECTION",
          title: "Arbitrary Command Execution Surface",
          description: `Tool '${toolName}' appears to execute shell commands directly on the host system.`,
          recommendation:
            "Restrain parameters to a strict enum or whitelist of subcommands instead of accepting free-form command strings.",
        });
      }

      // C. Path Traversal checks
      for (const [propName, propDef] of Object.entries<any>(properties)) {
        if (TRAVERSAL_PARAM_NAMES.includes(propName.toLowerCase())) {
          if (!propDef.pattern && !propDef.enum) {
            issues.push({
              id: `PATH-${toolName}-${propName}`,
              toolName,
              severity: "medium",
              category: "PATH_TRAVERSAL",
              title: `Unconstrained Filepath Parameter '${propName}'`,
              description: `Parameter '${propName}' accepts file paths without an explicit regex pattern or schema boundary constraint.`,
              recommendation:
                "Enforce path sandboxing, validate against allowed root directories, or disallow parent directory traversal sequences ('../').",
            });
          }
        }
      }

      // D. Destructive Mutations without Safeguards
      const isDestructive = DESTRUCTIVE_PREFIXES.some((prefix) =>
        toolName.toLowerCase().startsWith(prefix)
      );
      if (isDestructive) {
        const hasConfirmOrDryRun = Object.keys(properties).some((k) =>
          ["confirm", "dryrun", "dry_run", "force"].includes(k.toLowerCase())
        );
        if (!hasConfirmOrDryRun) {
          issues.push({
            id: `MUT-${toolName}`,
            toolName,
            severity: "medium",
            category: "DESTRUCTIVE_OPERATION",
            title: `Destructive Tool Lacks Dry-Run / Confirmation Guard`,
            description: `Tool '${toolName}' performs destructive operations but does not expose a 'dry_run' or 'confirm' boolean parameter.`,
            recommendation:
              "Add a 'dryRun: boolean' or 'confirm: boolean' property to require explicit affirmation before deleting or truncating data.",
          });
        }
      }

      // E. Unvalidated Input Schema (type "any" or missing properties)
      if (schema.type === "object" && (!properties || Object.keys(properties).length === 0)) {
        // Only if it doesn't declare it accepts no args
        if (schema.additionalProperties !== false) {
          issues.push({
            id: `SCHEMA-${toolName}`,
            toolName,
            severity: "low",
            category: "UNVALIDATED_INPUT",
            title: "Permissive Input Schema",
            description: `Tool '${toolName}' has an unconstrained schema with no property definitions or type limits.`,
            recommendation:
              "Define explicit parameter properties and types in 'inputSchema' to prevent arbitrary payload ingestion.",
          });
        }
      }
    }

    // 2. Optional Gemini Deep Security Audit
    let auditorType: "gemini" | "static-rubric" = "static-rubric";
    if (this.apiKey && tools.length > 0) {
      try {
        const geminiIssues = await this.auditWithGemini(tools);
        if (geminiIssues.length > 0) {
          issues.push(...geminiIssues);
          auditorType = "gemini";
        }
      } catch {
        // Fallback to static rubric cleanly
      }
    }

    // 3. Compute Score & Grade
    let score = 100;
    for (const issue of issues) {
      if (issue.severity === "critical") score -= 25;
      else if (issue.severity === "high") score -= 15;
      else if (issue.severity === "medium") score -= 8;
      else if (issue.severity === "low") score -= 3;
    }
    score = Math.max(0, Math.min(100, score));

    let grade: SecurityAuditReport["grade"] = "A+";
    if (score >= 95) grade = "A+";
    else if (score >= 85) grade = "A";
    else if (score >= 70) grade = "B";
    else if (score >= 50) grade = "C";
    else grade = "F";

    const summary =
      issues.length === 0
        ? `All ${tools.length} tool(s) passed security compliance with 0 vulnerabilities detected.`
        : `Security audit completed with ${issues.length} finding(s) across ${tools.length} tool(s). Score: ${score}/100 (Grade: ${grade}).`;

    return {
      overallScore: score,
      grade,
      totalToolsScanned: tools.length,
      issues,
      summary,
      timestamp: new Date().toISOString(),
      auditor: auditorType,
    };
  }

  private async auditWithGemini(
    tools: Array<{ name: string; description?: string; inputSchema?: any }>
  ): Promise<SecurityAuditIssue[]> {
    const prompt = `You are an expert cybersecurity auditor for Model Context Protocol (MCP) servers.
Analyze the following MCP tool definitions for indirect prompt injections, security boundaries, and high-risk flaws.
Respond ONLY with a valid JSON array of issues. If safe, return empty array [].
JSON Schema for each issue:
{
  "toolName": string,
  "severity": "critical" | "high" | "medium" | "low",
  "category": "PROMPT_INJECTION" | "COMMAND_INJECTION" | "PATH_TRAVERSAL" | "DESTRUCTIVE_OPERATION" | "UNVALIDATED_INPUT",
  "title": string,
  "description": string,
  "recommendation": string
}

Tools to audit:
${JSON.stringify(tools, null, 2)}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) return [];
    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item, idx) => ({
      id: `GEMINI-${idx}-${Date.now()}`,
      toolName: item.toolName || "tool",
      severity: item.severity || "medium",
      category: item.category || "UNVALIDATED_INPUT",
      title: item.title || "Security Finding",
      description: item.description || "",
      recommendation: item.recommendation || "Review tool configuration.",
    }));
  }
}

export function createSecurityAuditor(options?: SecurityAuditorOptions): SecurityAuditor {
  return new SecurityAuditor(options);
}
