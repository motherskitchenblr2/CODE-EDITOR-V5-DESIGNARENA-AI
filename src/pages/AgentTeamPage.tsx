// ============================================================================
// Volt Code AGI - Agent Team Page
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useSocket } from '../contexts/SocketProvider';
import { AgentState, AgentTask, AgentTab } from '../../shared/types';
import { AgentStatusBadge } from '../components/Agents/AgentStatusBadge';
import { TaskAssignmentWidget } from '../components/Agents/TaskAssignmentWidget';
import { EditorAgentPanel } from '../components/Agents/EditorAgentPanel';
import { GithubAgentPanel } from '../components/Agents/GithubAgentPanel';

// ==========================================================================
// Component
// ==========================================================================

export function AgentTeamPage() {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState<AgentTab>('editor');

  // Get agents by tab
  const agentsByTab = useMemo(() => {
    const tabs: AgentTab[] = ['editor', 'github', 'dashboard'];
    const result: Record<AgentTab, AgentState[]> = {
      editor: [],
      github: [],
      dashboard: [],
    };

    tabs.forEach((tab) => {
      result[tab] = socket.getAgentsByTab(tab);
    });

    return result;
  }, [socket]);

  // Get tasks by tab
  const tasksByTab = useMemo(() => {
    const tabs: AgentTab[] = ['editor', 'github', 'dashboard'];
    const result: Record<AgentTab, AgentTask[]> = {
      editor: [],
      github: [],
      dashboard: [],
    };

    tabs.forEach((tab) => {
      result[tab] = socket.tasks.filter((t) => t.tab === tab);
    });

    return result;
  }, [socket.tasks]);

  // Get stats
  const stats = useMemo(() => {
    const totalAgents = socket.agents.length;
    const onlineAgents = socket.agents.filter((a) => a.status !== 'offline').length;
    const totalTasks = socket.tasks.length;

    return {
      totalAgents,
      onlineAgents,
      totalTasks,
    };
  }, [socket.agents, socket.tasks]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
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
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#e0e0e0',
              marginBottom: '4px',
            }}
          >
            Agent Team
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#9ca3af',
            }}
          >
            Multi-Agent System Overview
          </div>
        </div>

        {/* System Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <AgentStatusBadge status="idle" size="sm" />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#10b981',
              }}
            >
              {stats.onlineAgents}/{stats.totalAgents} Online
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(255, 95, 31, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 95, 31, 0.3)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#FF5F1F',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#FF5F1F',
              }}
            >
              {stats.totalTasks} Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '4px',
          borderRadius: '8px',
        }}
      >
        {(['editor', 'github', 'dashboard'] as AgentTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === tab ? 'rgba(255, 95, 31, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeTab === tab ? '#FF5F1F' : '#9ca3af',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'capitalize',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 95, 31, 0.1)';
              (e.target as HTMLButtonElement).style.color = '#FF5F1F';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = activeTab === tab ? 'rgba(255, 95, 31, 0.2)' : 'transparent';
              (e.target as HTMLButtonElement).style.color = activeTab === tab ? '#FF5F1F' : '#9ca3af';
            }}
          >
            {tab} ({agentsByTab[tab].length})
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Left Column - Agent Panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {activeTab === 'editor' && <EditorAgentPanel />}
          {activeTab === 'github' && <GithubAgentPanel />}
          {activeTab === 'dashboard' && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 95, 31, 0.2)',
                padding: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#e0e0e0',
                  marginBottom: '12px',
                }}
              >
                Dashboard Agents
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {agentsByTab.dashboard.map((agent) => (
                  <div
                    key={agent.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 95, 31, 0.1)',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #FF5F1F 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                      }}
                    >
                      🎯
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#e0e0e0',
                        }}
                      >
                        {agent.config.alias || agent.id}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                        }}
                      >
                        {agent.config.description}
                      </div>
                    </div>
                    <AgentStatusBadge status={agent.status} size="sm" showLabel />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Tasks */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px 12px 0 0',
              border: '1px solid rgba(255, 95, 31, 0.2)',
              borderBottom: 'none',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#e0e0e0',
              }}
            >
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab Tasks ({tasksByTab[activeTab].length})
            </div>
          </div>
          
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '0 0 12px 12px',
              border: '1px solid rgba(255, 95, 31, 0.2)',
              borderTop: 'none',
            }}
          >
            <TaskAssignmentWidget
              tasks={tasksByTab[activeTab]}
              showEmptyState
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// Memoized Component
// ==========================================================================

export const MemoizedAgentTeamPage = React.memo(AgentTeamPage);

// ==========================================================================
// Export
// ==========================================================================

export default AgentTeamPage;
