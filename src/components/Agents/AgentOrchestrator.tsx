// ============================================================================
// Volt Code AGI - Agent Orchestrator Component
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { useSocket } from '../../contexts/SocketProvider';
import { AgentState, AgentTask, AgentTab, AgentStatus, TaskStatus } from '../../../shared/types';
import { AgentStatusBadge } from './AgentStatusBadge';
import { TaskAssignmentWidget } from './TaskAssignmentWidget';
import { EditorAgentPanel } from './EditorAgentPanel';
import { GithubAgentPanel } from './GithubAgentPanel';

// ==========================================================================
// Props
// ==========================================================================

export interface AgentOrchestratorProps {
  className?: string;
}

// ==========================================================================
// Component
// ==========================================================================

export function AgentOrchestrator({ className = '' }: AgentOrchestratorProps) {
  const socket = useSocket();
  const [activeView, setActiveView] = useState<'overview' | 'editor' | 'github' | 'dashboard'>('overview');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Get all agents
  const allAgents = useMemo(() => {
    return socket.agents;
  }, [socket.agents]);

  // Get all tasks
  const allTasks = useMemo(() => {
    return socket.tasks;
  }, [socket.tasks]);

  // Get system stats
  const systemStats = useMemo(() => {
    const totalAgents = allAgents.length;
    const onlineAgents = allAgents.filter((a) => a.status !== 'offline').length;
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = allTasks.filter((t) => t.status === 'pending').length;

    return {
      totalAgents,
      onlineAgents,
      totalTasks,
      completedTasks,
      pendingTasks,
    };
  }, [allAgents, allTasks]);

  // Get agents by tab
  const agentsByTab = useMemo(() => {
    const tabs: AgentTab[] = ['editor', 'github', 'dashboard'];
    const result: Record<AgentTab, AgentState[]> = {
      editor: [],
      github: [],
      dashboard: [],
    };

    tabs.forEach((tab) => {
      result[tab] = allAgents.filter((a) => a.tab === tab);
    });

    return result;
  }, [allAgents]);

  // Handle agent click
  const handleAgentClick = useCallback((agentId: string) => {
    setSelectedAgentId(selectedAgentId === agentId ? null : agentId);
  }, [selectedAgentId]);

  // Handle view change
  const handleViewChange = useCallback((view: 'overview' | 'editor' | 'github' | 'dashboard') => {
    setActiveView(view);
    setSelectedAgentId(null);
  }, []);

  // Get agent stats
  const agentStats = useMemo(() => {
    const stats: Record<AgentStatus, number> = {
      idle: 0,
      busy: 0,
      error: 0,
      offline: 0,
    };

    allAgents.forEach((agent) => {
      stats[agent.status]++;
    });

    return stats;
  }, [allAgents]);

  // Get task stats
  const taskStats = useMemo(() => {
    const stats: Record<TaskStatus, number> = {
      pending: 0,
      assigned: 0,
      'in-progress': 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    allTasks.forEach((task) => {
      stats[task.status]++;
    });

    return stats;
  }, [allTasks]);

  return (
    <div
      className={`agent-orchestrator ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255, 95, 31, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 95, 31, 0.3)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(255, 95, 31, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderBottom: '1px solid rgba(255, 95, 31, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF5F1F 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ⚡
          </div>
          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#e0e0e0',
              }}
            >
              Volt Code AGI
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#9ca3af',
              }}
            >
              Multi-Agent Orchestrator
            </div>
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
              padding: '6px 12px',
              background: systemStats.onlineAgents > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              borderRadius: '6px',
              border: `1px solid ${systemStats.onlineAgents > 0 ? '#10b981' : '#ef4444'}40`,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: systemStats.onlineAgents > 0 ? '#10b981' : '#ef4444',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: systemStats.onlineAgents > 0 ? '#10b981' : '#ef4444',
              }}
            >
              {systemStats.onlineAgents}/{systemStats.totalAgents} Agents Online
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(255, 95, 31, 0.15)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 95, 31, 0.4)',
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
                fontSize: '12px',
                fontWeight: 600,
                color: '#FF5F1F',
              }}
            >
              {systemStats.totalTasks} Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          padding: '0 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 95, 31, 0.1)',
        }}
      >
        {(['overview', 'editor', 'github', 'dashboard'] as const).map((view) => (
          <button
            key={view}
            onClick={() => handleViewChange(view)}
            style={{
              padding: '12px 20px',
              background: activeView === view ? 'rgba(255, 95, 31, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeView === view ? '#FF5F1F' : '#9ca3af',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'capitalize' as const,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 95, 31, 0.1)';
              (e.target as HTMLButtonElement).style.color = '#FF5F1F';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = activeView === view ? 'rgba(255, 95, 31, 0.2)' : 'transparent';
              (e.target as HTMLButtonElement).style.color = activeView === view ? '#FF5F1F' : '#9ca3af';
            }}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {activeView === 'overview' && (
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              overflow: 'hidden',
            }}
          >
            {/* Left Sidebar - Agent List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(255, 95, 31, 0.1)',
                background: 'rgba(0, 0, 0, 0.2)',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  padding: '16px 12px',
                  borderBottom: '1px solid rgba(255, 95, 31, 0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '12px',
                  }}
                >
                  Agent Tabs
                </div>
                
                {(['editor', 'github', 'dashboard'] as AgentTab[]).map((tab) => (
                  <div
                    key={tab}
                    style={{
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#9ca3af',
                          textTransform: 'uppercase',
                        }}
                      >
                        {tab}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#6b7280',
                          padding: '2px 6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px',
                        }}
                      >
                        {agentsByTab[tab].length}
                      </span>
                    </div>
                    
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {agentsByTab[tab].map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => handleAgentClick(agent.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            background: selectedAgentId === agent.id 
                              ? 'rgba(255, 95, 31, 0.2)' 
                              : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLButtonElement).style.background = 'rgba(255, 95, 31, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLButtonElement).style.background = selectedAgentId === agent.id 
                              ? 'rgba(255, 95, 31, 0.2)' 
                              : 'transparent';
                          }}
                        >
                          <AgentStatusBadge status={agent.status} size="sm" />
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#e0e0e0',
                            }}
                          >
                            {agent.config.alias || agent.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div
                style={{
                  padding: '16px 12px',
                  borderTop: '1px solid rgba(255, 95, 31, 0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '12px',
                  }}
                >
                  Agent Status
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                  }}
                >
                  {(['idle', 'busy', 'error', 'offline'] as AgentStatus[]).map((status) => (
                    <div
                      key={status}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '4px',
                      }}
                    >
                      <AgentStatusBadge status={status} size="sm" />
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#d1d5db',
                        }}
                      >
                        {agentStats[status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content - Tasks */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255, 95, 31, 0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#e0e0e0',
                  }}
                >
                  All Tasks ({allTasks.length})
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                }}
              >
                <TaskAssignmentWidget
                  tasks={allTasks}
                  showEmptyState={false}
                />
              </div>
            </div>
          </div>
        )}

        {activeView === 'editor' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <EditorAgentPanel />
          </div>
        )}

        {activeView === 'github' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <GithubAgentPanel />
          </div>
        )}

        {activeView === 'dashboard' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              padding: '20px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#e0e0e0',
              }}
            >
              Dashboard
            </div>

            {/* System Overview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              {[
                { label: 'Total Agents', value: systemStats.totalAgents, color: '#FF5F1F' },
                { label: 'Online Agents', value: systemStats.onlineAgents, color: '#10b981' },
                { label: 'Total Tasks', value: systemStats.totalTasks, color: '#3b82f6' },
                { label: 'Completed Tasks', value: systemStats.completedTasks, color: '#8b5cf6' },
                { label: 'Pending Tasks', value: systemStats.pendingTasks, color: '#fbbf24' },
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 95, 31, 0.1)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px',
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: stat.color,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Agent Distribution */}
            <div
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 95, 31, 0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e0e0e0',
                  marginBottom: '12px',
                }}
              >
                Agent Distribution
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                }}
              >
                {(['editor', 'github', 'dashboard'] as AgentTab[]).map((tab) => (
                  <div
                    key={tab}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#d1d5db',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tab}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#FF5F1F',
                      }}
                    >
                      {agentsByTab[tab].length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Distribution */}
            <div
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 95, 31, 0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e0e0e0',
                  marginBottom: '12px',
                }}
              >
                Task Distribution
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                }}
              >
                {(['pending', 'assigned', 'in-progress', 'completed', 'failed'] as TaskStatus[]).map((status) => (
                  <div
                    key={status}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#d1d5db',
                        textTransform: 'capitalize',
                      }}
                    >
                      {status.replace('-', ' ')}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: status === 'completed' ? '#10b981' : 
                               status === 'failed' ? '#ef4444' :
                               status === 'in-progress' ? '#8b5cf6' : '#fbbf24',
                      }}
                    >
                      {taskStats[status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// Memoized Component
// ==========================================================================

export const MemoizedAgentOrchestrator = React.memo(AgentOrchestrator);

// ==========================================================================
// Export
// ==========================================================================

export default AgentOrchestrator;
