// ============================================================================
// Volt Code AGI - Agent Orchestrator Page
// ============================================================================

import React from 'react';
import { AgentOrchestrator } from '../components/Agents/AgentOrchestrator';

// ==========================================================================
// Component
// ==========================================================================

export function AgentOrchestratorPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--charcoal)',
        padding: '20px',
        gap: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF5F1F 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          ⚡
        </div>
        <div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#e0e0e0',
              marginBottom: '4px',
            }}
          >
            Agent Orchestrator
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#9ca3af',
            }}
          >
            Central Hub for Multi-Agent Coordination
          </div>
        </div>
      </div>

      {/* System Online Indicator */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          alignSelf: 'flex-start',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse 2s infinite',
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#10b981',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          System Online
        </span>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>

      {/* Orchestrator */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <AgentOrchestrator />
      </div>
    </div>
  );
}

// ==========================================================================
// Memoized Component
// ==========================================================================

export const MemoizedAgentOrchestratorPage = React.memo(AgentOrchestratorPage);

// ==========================================================================
// Export
// ==========================================================================

export default AgentOrchestratorPage;
