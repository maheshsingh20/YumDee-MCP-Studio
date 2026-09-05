/**
 * @yumdee/mcp-studio-bench
 *
 * Compliance scoring and reliability testing for MCP servers.
 *
 * Features:
 * - Spec compliance validation (handshake, JSON-RPC 2.0 error format, etc.)
 * - Latency percentile analysis (P50, P95, min, max)
 * - Tool success rate scoring
 * - Regression detection via replay
 * - CI/CD integration (fail if score < threshold)
 */

import { McpSession, McpResponseEvent } from "@yumdee/mcp-studio-core";

/**
 * Compliance score breakdown by metric
 */
export interface ComplianceScore {
  overall: number; // 0-100 score
  breakdown: {
    specCompliance: number;
    latencyPercentile50: number;
    latencyPercentile95: number;
    successRate: number;
    errorCount: number;
  };
  timestamp: string; // ISO 8601
  sessionId: string;
}

/**
 * Benchmark configuration
 */
export interface BenchConfig {
  minScore?: number; // CI will fail if score falls below this
  iterations?: number; // How many times to call each tool
  timeout?: number; // Milliseconds per call
}

export interface RegressionFinding {
  field: string;
  change: number;
  severity: "info" | "warning" | "error";
  message: string;
}

/**
 * Compliance benchmark runner
 */
export class Benchmark {
  private config: BenchConfig;

  constructor(config: BenchConfig = {}) {
    this.config = {
      minScore: config.minScore || 80,
      iterations: config.iterations || 5,
      timeout: config.timeout || 5000,
    };
  }

  /**
   * Score a recorded session (deterministic, no network calls)
   */
  scoreSession(session: McpSession): ComplianceScore {
    const events = session.events || [];
    const requestEvents = events.filter((e) => e.type === "request");
    const responseEvents = events.filter((e) => e.type === "response") as McpResponseEvent[];
    const errorEvents = events.filter((e) => e.type === "error");

    // 1. Spec Compliance Evaluation (0 - 100)
    let specCompliance = 0;

    // A. Handshake Check: First request must be "initialize"
    const hasInitialize = requestEvents.length > 0 && requestEvents[0].method === "initialize";
    if (hasInitialize) {
      specCompliance += 30;
    }

    // B. Response ID Matching: Every response matches a known request
    const requestIds = new Set(requestEvents.map((r) => r.id));
    let matchingIds = 0;
    for (const res of responseEvents) {
      if (requestIds.has(res.id)) {
        matchingIds++;
      }
    }
    const matchingRatio = responseEvents.length > 0 ? matchingIds / responseEvents.length : 1;
    specCompliance += Math.round(matchingRatio * 30);

    // C. Server Info Check
    if (session.serverInfo && session.serverInfo.name && session.serverInfo.version) {
      specCompliance += 20;
    }

    // D. Error Format Conformance (Standard JSON-RPC 2.0 error codes)
    const errResponses = responseEvents.filter((r) => r.error);
    let validErrorCodes = 0;
    for (const r of errResponses) {
      if (typeof r.error?.code === "number" && typeof r.error?.message === "string") {
        validErrorCodes++;
      }
    }
    const errFormatRatio = errResponses.length > 0 ? validErrorCodes / errResponses.length : 1;
    specCompliance += Math.round(errFormatRatio * 20);

    specCompliance = Math.min(100, Math.max(0, specCompliance));

    // 2. Latency Percentiles (P50, P95)
    const latencies = responseEvents
      .map((r) => r.latencyMs)
      .filter((l): l is number => typeof l === "number" && l >= 0)
      .sort((a, b) => a - b);

    let p50 = 0;
    let p95 = 0;
    if (latencies.length > 0) {
      p50 = latencies[Math.floor(latencies.length * 0.5)];
      p95 = latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))];
    }

    // Latency Score (0 - 100): Fast < 100ms is 100, > 1000ms scales down
    let latencyScore = 100;
    if (p50 > 100) {
      latencyScore = Math.max(10, Math.round(100 - (p50 - 100) * 0.1));
    }

    // 3. Success Rate (0.0 - 1.0)
    const totalCalls = responseEvents.length;
    const errorCount = errorEvents.length + errResponses.length;
    const successfulCalls = responseEvents.filter((r) => !r.error).length;
    const successRate = totalCalls > 0 ? successfulCalls / totalCalls : 1.0;

    // 4. Overall Weighted Score (0 - 100)
    const overall = Math.round(
      specCompliance * 0.4 +
      successRate * 100 * 0.35 +
      latencyScore * 0.25
    );

    return {
      overall: Math.min(100, Math.max(0, overall)),
      breakdown: {
        specCompliance,
        latencyPercentile50: p50,
        latencyPercentile95: p95,
        successRate: Number(successRate.toFixed(3)),
        errorCount,
      },
      timestamp: new Date().toISOString(),
      sessionId: session.id,
    };
  }

  /**
   * Detect regressions between two sessions (baseline vs current)
   */
  detectRegressions(
    baseline: McpSession,
    current: McpSession
  ): RegressionFinding[] {
    const findings: RegressionFinding[] = [];
    const baselineScore = this.scoreSession(baseline);
    const currentScore = this.scoreSession(current);

    // Score degradation
    const overallDiff = currentScore.overall - baselineScore.overall;
    if (overallDiff < -10) {
      findings.push({
        field: "overallScore",
        change: overallDiff,
        severity: "error",
        message: `Overall compliance score dropped by ${Math.abs(overallDiff)} points (${baselineScore.overall} -> ${currentScore.overall})`,
      });
    } else if (overallDiff < 0) {
      findings.push({
        field: "overallScore",
        change: overallDiff,
        severity: "warning",
        message: `Overall compliance score decreased slightly by ${Math.abs(overallDiff)} points`,
      });
    }

    // Latency regression
    const p95Diff = currentScore.breakdown.latencyPercentile95 - baselineScore.breakdown.latencyPercentile95;
    if (baselineScore.breakdown.latencyPercentile95 > 0 && p95Diff > 50) {
      const pctIncrease = Math.round((p95Diff / baselineScore.breakdown.latencyPercentile95) * 100);
      findings.push({
        field: "latencyP95",
        change: p95Diff,
        severity: pctIncrease > 50 ? "error" : "warning",
        message: `P95 latency increased by ${p95Diff}ms (+${pctIncrease}%)`,
      });
    }

    // New errors
    const errorDiff = currentScore.breakdown.errorCount - baselineScore.breakdown.errorCount;
    if (errorDiff > 0) {
      findings.push({
        field: "errorCount",
        change: errorDiff,
        severity: "error",
        message: `Current session introduced ${errorDiff} new error(s)`,
      });
    }

    // Success rate drop
    const successDiff = Number(
      (currentScore.breakdown.successRate - baselineScore.breakdown.successRate).toFixed(3)
    );
    if (successDiff < 0) {
      findings.push({
        field: "successRate",
        change: successDiff,
        severity: "error",
        message: `Success rate dropped from ${(baselineScore.breakdown.successRate * 100).toFixed(1)}% to ${(currentScore.breakdown.successRate * 100).toFixed(1)}%`,
      });
    }

    return findings;
  }

  /**
   * Generate a human-readable report
   */
  generateReport(score: ComplianceScore): string {
    const passed = score.overall >= (this.config.minScore || 80);
    const badge = passed ? "✅ PASSED" : "❌ FAILED";

    return `
=============================================================
  MCP Studio Compliance Report
=============================================================
Overall Score: ${score.overall}/100  [${badge} (Min required: ${this.config.minScore || 80})]

Breakdown:
  • Spec Compliance:   ${score.breakdown.specCompliance}/100
  • P50 Latency:       ${score.breakdown.latencyPercentile50} ms
  • P95 Latency:       ${score.breakdown.latencyPercentile95} ms
  • Success Rate:      ${(score.breakdown.successRate * 100).toFixed(1)}%
  • Total Errors:      ${score.breakdown.errorCount}

Session ID: ${score.sessionId}
Generated:  ${score.timestamp}
=============================================================
`.trim();
  }
}

export function createBenchmark(config?: BenchConfig): Benchmark {
  return new Benchmark(config);
}
