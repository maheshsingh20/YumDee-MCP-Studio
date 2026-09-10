/**
 * UI Type Definitions
 */

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  bg: string;
  surfaceCard1: string;
  surfaceCard2: string;
  textHeading: string;
  textBody: string;
  border: string;
  accent: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  btnFilledBg: string;
  btnFilledText: string;
  btnOutlinedBorder: string;
  btnOutlinedText: string;
  cardToneA: string;
  cardToneB: string;
  inputBg: string;
}

export interface ToolDef {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  };
}

export interface ServerInfo {
  name: string;
  version: string;
  transport: string;
  command?: string;
  endpoint?: string;
}

export interface EventItem {
  type: string;
  timestamp: string;
  id?: number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
  message?: string;
  latencyMs?: number;
}

export interface DiagnosticResult {
  category: string;
  rootCause: string;
  suggestedFix: string;
  correctedArgs?: any;
  confidence: number;
  provider?: "gemini" | "heuristic";
}

export interface ReplayItem {
  toolName: string;
  args: any;
  originalResponse: any;
  originalLatencyMs: number;
  replayedResponse: any;
  replayedError?: any;
  replayedLatencyMs: number;
  matched: boolean;
}

export type ViewMode = "inspector" | "agent" | "audit";

export interface AiSettings {
  apiKey: string;
  model: string;
  status?: "untested" | "valid" | "invalid";
  statusMessage?: string;
}

export interface AgentStep {
  toolName: string;
  args: any;
  result?: any;
  error?: string;
  latencyMs?: number;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  steps?: AgentStep[];
  metrics?: {
    totalCandidateTools?: number;
    selectedTools?: number;
    tokenSavingsPercent?: number;
    reductionFactor?: number;
  };
  timestamp: string;
}

export interface SecurityIssue {
  id: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  description: string;
  toolName?: string;
  paramName?: string;
  evidence?: string;
  recommendation: string;
}

export interface SecurityAuditReport {
  serverName: string;
  timestamp: string;
  overallScore: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  totalToolsScanned: number;
  issues: SecurityIssue[];
  summary: string;
  recommendations: string[];
}
