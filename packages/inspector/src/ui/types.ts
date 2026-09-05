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
