import React from "react";
import { useInspector, UseInspectorOptions } from "./hooks/useInspector.js";
import { getThemeColors } from "./theme.js";
import { Navbar } from "./components/Navbar.js";
import { Hero } from "./components/Hero.js";
import { FeatureGrid } from "./components/FeatureGrid.js";
import { ConnectionBar } from "./components/ConnectionBar.js";
import { ToolsExplorer } from "./components/ToolsExplorer.js";
import { ToolRunner } from "./components/ToolRunner.js";
import { EventsTimeline } from "./components/EventsTimeline.js";
import { DiagnosticModal } from "./components/DiagnosticModal.js";
import { ReplayModal } from "./components/ReplayModal.js";
import { AiSettingsModal } from "./components/AiSettingsModal.js";
import { AgentPlayground } from "./components/AgentPlayground.js";
import { SecurityAuditView } from "./components/SecurityAuditView.js";

export type InspectorUIProps = UseInspectorOptions;

export function App(props: InspectorUIProps) {
  const inspector = useInspector(props);
  const colors = getThemeColors(inspector.theme);

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.textBody,
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.15s ease",
      }}
    >
      {/* Toast Status Notification */}
      {inspector.statusMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            backgroundColor: colors.surfaceCard2,
            border: colors.border,
            color: colors.textHeading,
            padding: "10px 18px",
            borderRadius: "5px",
            fontSize: 13,
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        >
          {inspector.statusMessage}
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        colors={colors}
        theme={inspector.theme}
        toggleTheme={inspector.toggleTheme}
        connected={inspector.connected}
        serverInfo={inspector.serverInfo}
        onOpenReplay={inspector.handleOpenReplay}
        onSaveSession={inspector.handleSaveSession}
        sessionId={inspector.sessionId}
        viewMode={inspector.viewMode}
        setViewMode={inspector.setViewMode}
        onOpenAiSettings={() => inspector.setShowAiSettingsModal(true)}
        hasAiKey={!!inspector.aiSettings.apiKey}
      />

      {/* Hero Section */}
      <Hero
        colors={colors}
        connected={inspector.connected}
        serverInfo={inspector.serverInfo}
        tools={inspector.tools}
        eventsCount={inspector.events.length}
      />

      {/* Server Connection Bar (Always Accessible) */}
      <div
        style={{
          maxWidth: 1120,
          width: "100%",
          margin: "0 auto",
          padding: "0 32px 16px",
          boxSizing: "border-box",
        }}
      >
        <ConnectionBar
          colors={colors}
          transport={inspector.transport}
          setTransport={inspector.setTransport}
          command={inspector.command}
          setCommand={inspector.setCommand}
          httpUrl={inspector.httpUrl}
          setHttpUrl={inspector.setHttpUrl}
          connected={inspector.connected}
          loading={inspector.loading}
          onConnect={inspector.handleConnect}
          onDisconnect={inspector.handleDisconnect}
        />
      </div>

      {/* Main View Mode Content */}
      {inspector.viewMode === "inspector" && (
        <>
          {/* Alternating Feature Cards Grid */}
          <FeatureGrid colors={colors} />

          {/* 3-Column Studio Workspace Section */}
          <section
            id="workspace"
            style={{
              maxWidth: 1120,
              width: "100%",
              margin: "0 auto",
              padding: "0 32px 64px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* 3-Column Studio Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "280px 1fr 320px",
                gap: 16,
                minHeight: 520,
              }}
            >
              {/* Column 1: Tools Explorer */}
              <ToolsExplorer
                colors={colors}
                filteredTools={inspector.filteredTools}
                selectedTool={inspector.selectedTool}
                selectTool={inspector.selectTool}
                searchTerm={inspector.searchTerm}
                setSearchTerm={inspector.setSearchTerm}
                connected={inspector.connected}
              />

              {/* Column 2: Tool Runner & Schema Form */}
              <ToolRunner
                colors={colors}
                selectedTool={inspector.selectedTool}
                toolArgs={inspector.toolArgs}
                setToolArgs={inspector.setToolArgs}
                toolResult={inspector.toolResult}
                invoking={inspector.invoking}
                connected={inspector.connected}
                diagnosing={inspector.diagnosing}
                onInvoke={inspector.handleInvoke}
                onDiagnose={inspector.handleDiagnose}
              />

              {/* Column 3: Live Session Timeline */}
              <EventsTimeline
                colors={colors}
                events={inspector.events}
                selectedEvent={inspector.selectedEvent}
                setSelectedEvent={inspector.setSelectedEvent}
                onExportJsonl={inspector.handleExportJsonl}
                eventEndRef={inspector.eventEndRef}
                onDiagnose={inspector.handleDiagnose}
                selectedTool={inspector.selectedTool}
                toolArgs={inspector.toolArgs}
                diagnosing={inspector.diagnosing}
              />
            </div>
          </section>
        </>
      )}

      {/* View Mode: Agent Playground */}
      {inspector.viewMode === "agent" && (
        <AgentPlayground
          colors={colors}
          connected={inspector.connected}
          serverInfo={inspector.serverInfo}
          apiKey={inspector.aiSettings.apiKey}
          model={inspector.aiSettings.model}
          messages={inspector.agentMessages}
          running={inspector.runningAgent}
          useSemanticRouting={inspector.useSemanticRouting}
          setUseSemanticRouting={inspector.setUseSemanticRouting}
          onSendMessage={inspector.handleRunAgentChat}
          onClearMessages={inspector.handleClearAgentMessages}
          onOpenSettings={() => inspector.setShowAiSettingsModal(true)}
        />
      )}

      {/* View Mode: Security Audit */}
      {inspector.viewMode === "audit" && (
        <SecurityAuditView
          colors={colors}
          connected={inspector.connected}
          serverInfo={inspector.serverInfo}
          report={inspector.auditReport}
          auditing={inspector.auditing}
          onRunAudit={inspector.handleRunAudit}
        />
      )}

      {/* AI Diagnostic Copilot Modal */}
      <DiagnosticModal
        colors={colors}
        show={inspector.showDiagnosticModal}
        onClose={() => inspector.setShowDiagnosticModal(false)}
        diagnostic={inspector.diagnostic}
        diagnosing={inspector.diagnosing}
        onApplyFix={inspector.handleApplyFix}
      />

      {/* Session Replay & Regression Diff Modal */}
      <ReplayModal
        colors={colors}
        show={inspector.showReplayModal}
        onClose={() => {
          inspector.setShowReplayModal(false);
        }}
        savedSessions={inspector.savedSessions}
        onRunReplay={inspector.handleRunReplay}
        replaying={inspector.replaying}
        replayResults={inspector.replayResults}
      />

      {/* Gemini AI Settings Modal */}
      <AiSettingsModal
        colors={colors}
        show={inspector.showAiSettingsModal}
        onClose={() => inspector.setShowAiSettingsModal(false)}
        aiSettings={inspector.aiSettings}
        onSaveSettings={inspector.handleSaveAiSettings}
        onTestKey={inspector.handleTestAiKey}
      />
    </div>
  );
}
