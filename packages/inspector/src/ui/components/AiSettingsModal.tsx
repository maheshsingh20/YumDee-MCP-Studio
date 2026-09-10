import React, { useState, useEffect } from "react";
import { ThemeColors, AiSettings } from "../types.js";

interface AiSettingsModalProps {
  colors: ThemeColors;
  show: boolean;
  onClose: () => void;
  aiSettings: AiSettings;
  onSaveSettings: (settings: AiSettings) => void;
  onTestKey: (apiKey: string, model: string) => Promise<{ valid: boolean; message?: string }>;
}

export function AiSettingsModal({
  colors,
  show,
  onClose,
  aiSettings,
  onSaveSettings,
  onTestKey,
}: AiSettingsModalProps) {
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || "");
  const [model, setModel] = useState(aiSettings.model && aiSettings.model !== "gemini-1.5-flash" ? aiSettings.model : "gemini-2.0-flash");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message?: string } | null>(null);

  useEffect(() => {
    setApiKey(aiSettings.apiKey || "");
    setModel(aiSettings.model && aiSettings.model !== "gemini-1.5-flash" ? aiSettings.model : "gemini-2.0-flash");
    setTestResult(null);
  }, [show, aiSettings]);

  if (!show) return null;

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ valid: false, message: "Please enter a Gemini API key to test." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestKey(apiKey.trim(), model);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ valid: false, message: err.message || "Connection test failed." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      apiKey: apiKey.trim(),
      model,
      status: testResult?.valid ? "valid" : apiKey.trim() ? "untested" : "invalid",
      statusMessage: testResult?.message,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1100,
      }}
    >
      <div
        style={{
          backgroundColor: colors.surfaceCard1,
          border: colors.border,
          borderRadius: "6px",
          width: "560px",
          maxWidth: "92vw",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: colors.border,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚙️</span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontFamily: "'Fraunces', serif",
                  color: colors.textHeading,
                }}
              >
                Google Gemini AI Settings
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: colors.textBody }}>
                Powers Agent Playground, Semantic Tool Router & AI RCA Copilot
              </p>
            </div>
          </div>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: colors.textBody,
              cursor: "pointer",
              fontSize: 16,
            }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* API Key Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.textHeading,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>GEMINI API KEY</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: colors.accent,
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: 11,
                }}
              >
                Get a free key →
              </a>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type={showKey ? "text" : "password"}
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: colors.border,
                  backgroundColor: colors.inputBg,
                  color: colors.textHeading,
                  fontSize: 13,
                  fontFamily: "monospace",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  padding: "0 12px",
                  backgroundColor: colors.surfaceCard2,
                  border: colors.border,
                  borderRadius: "5px",
                  color: colors.textBody,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <span style={{ fontSize: 11, color: colors.textBody }}>
              Stored locally in browser storage. Falls back to <code>process.env.GEMINI_API_KEY</code> on server.
            </span>
          </div>

          {/* Model Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.textHeading }}>
              AI MODEL
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "5px",
                border: colors.border,
                backgroundColor: colors.inputBg,
                color: colors.textHeading,
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended — High speed & agentic reasoning)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Next-Gen — Advanced reasoning)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Auto-updating Latest Flash)</option>
              <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (Experimental Features)</option>
            </select>
          </div>

          {/* Test Status Indicator */}
          {testResult && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "5px",
                border: testResult.valid
                  ? "0.5px solid #10B981"
                  : "0.5px solid #EF4444",
                backgroundColor: testResult.valid
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                color: testResult.valid ? "#10B981" : "#EF4444",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{testResult.valid ? "✅" : "⚠️"}</span>
              <span>{testResult.message || (testResult.valid ? "Key verified successfully!" : "Verification failed.")}</span>
            </div>
          )}

          {/* Zero-Key Fallback Note */}
          <div
            style={{
              padding: 12,
              backgroundColor: colors.surfaceCard2,
              borderRadius: "5px",
              border: colors.border,
              fontSize: 12,
              color: colors.textBody,
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: colors.textHeading }}>💡 Zero-Key Fallback Active:</strong>
            {" "}Without a key, the Inspector runs rule-based heuristic RCA and sparse TF-IDF semantic routing. Providing a key unlocks deep generative reasoning, dense Gemini embeddings, and generative multi-server agent workflows.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: colors.border,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.surfaceCard2,
          }}
        >
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: "5px",
              border: colors.border,
              backgroundColor: colors.surfaceCard1,
              color: colors.textHeading,
              fontSize: 12,
              fontWeight: 600,
              cursor: testing || !apiKey.trim() ? "not-allowed" : "pointer",
              opacity: testing || !apiKey.trim() ? 0.6 : 1,
            }}
          >
            {testing ? "Testing..." : "⚡ Test Key"}
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "transparent",
                color: colors.textBody,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: "8px 18px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: colors.accent,
                color: colors.btnFilledText,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
