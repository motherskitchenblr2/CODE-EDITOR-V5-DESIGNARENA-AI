// ============================================================================
// Volt Code AGI - GitHub Agent Panel Component
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { useSocket } from '../contexts/SocketProvider';
import { AgentState, AgentTask, TaskPriority, AgentTab, AgentType } from '../../../shared/types';
import { AgentStatusBadge } from './AgentStatusBadge';
import { TaskAssignmentWidget } from './TaskAssignmentWidget';
import { AgentMessageBubble } from './AgentMessageBubble';

// ==========================================================================
// Props
// ==========================================================================

export interface GithubAgentPanelProps {
  className?: string;
}

// ==========================================================================
// Quick Action Configuration
// ==========================================================================

const QUICK_ACTIONS = [
  { label: 'Create PR', icon: '📦', description: 'Create a new pull request' },
  { label: 'Check Conflicts', icon: '🌿', description: 'Check for merge conflicts' },
  { label: 'Bug Fix', icon: '🐛', description: 'Fix a bug' },
  { label: 'Update Deps', icon: '📦', description: 'Update dependencies' },
];

// ==========================================================================
// Component
// ==========================================================================

export function GithubAgentPanel({ className = '' }: GithubAgentPanelProps) {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'status'>('chat');
  const [activeAgentType, setActiveAgentType] = useState<AgentType | 'all'>('all');
  const [newMessage, setNewMessage] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  // Get GitHub agents
  const githubAgents = useMemo(() => {
    return socket.getAgentsByTab('github');
  }, [socket]);

  // Get messages for GitHub agents
  const githubMessages = useMemo(() => {
    return socket.messages.filter((msg) => msg.tab === 'github');
  }, [socket.messages]);

  // Get tasks for GitHub agents
  const githubTasks = useMemo(() => {
    return socket.tasks.filter((task) => task.tab === 'github');
  }, [socket.tasks]);

  // Filter agents by type
  const filteredAgents = useMemo(() => {
    if (activeAgentType === 'all') return githubAgents;
    return githubAgents.filter((a) => a.type === activeAgentType);
  }, [githubAgents, activeAgentType]);

  // Filter messages by agent
  const filteredMessages = useMemo(() => {
    if (activeAgentType === 'all') return githubMessages;
    return githubMessages.filter((msg) => msg.from === activeAgentType || msg.to === activeAgentType);
  }, [githubMessages, activeAgentType]);

  // Handle quick action
  const handleQuickAction = useCallback((action: string) => {
    const task: Partial<AgentTask> = {
      title: action,
      description: `Quick action: ${action}`,
      priority: 'medium',
      tab: 'github',
      createdBy: 'user',
    };

    socket.emitAgentTaskCreate(task as any);
  }, [socket]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const targetAgent = activeAgentType === 'all' ? 'pr-agent-001' : `${activeAgentType}-001`;

    const message = {
      id: `msg-${Date.now()}`,
      from: 'user',
      to: targetAgent,
      content: newMessage,
      taskId: null,
      tab: 'github' as AgentTab,
      timestamp: Date.now(),
      read: false,
    };

    socket.emitAgentMessage(message);
    setNewMessage('');
  }, [newMessage, activeAgentType, socket]);

  // Handle create task
  const handleCreateTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;

    const task = {
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
      tab: 'github' as AgentTab,
      createdBy: 'user',
    };

    socket.emitAgentTaskCreate(task);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
  }, [newTaskTitle, newTaskDescription, newTaskPriority, socket]);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Get active agent
  const activeAgent = useMemo(() => {
    return filteredAgents.find((a) => a.status !== 'offline') || filteredAgents[0];
  }, [filteredAgents]);

  return (
    <div
      className={`github-agent-panel ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
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
          background: 'rgba(59, 130, 246, 0.1)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            🌐
          </div>
          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#e0e0e0',
              }}
            >
              GitHub Tab
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#9ca3af',
              }}
            >
              PR, branch, bug fix & dependency management
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {activeAgent && <AgentStatusBadge status={activeAgent.status} size="md" showLabel />}
        </div>
      </div>

      {/* Agent Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '0 20px 8px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveAgentType('all')}
          style={{
            padding: '6px 12px',
            background: activeAgentType === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: activeAgentType === 'all' ? '#60a5fa' : '#9ca3af',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          All Agents
        </button>
        
        {(['pr-agent', 'branch-conflict', 'bug-fix', 'dependency-update'] as AgentType[]).map((type) => {
          const agent = githubAgents.find((a) => a.type === type);
          return (
            <button
              key={type}
              onClick={() => setActiveAgentType(type)}
              style={{
                padding: '6px 12px',
                background: activeAgentType === type ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: activeAgentType === type ? '#60a5fa' : '#9ca3af',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {agent && <AgentStatusBadge status={agent.status} size="sm" />}
              {agent?.config.alias || type}
            </button>
          );
        })}
      </div>

      {/* Content Tabs */}
      <div
        style={{
          display: 'flex',
          padding: '0 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
        }}
      >
        {(['chat', 'tasks', 'status'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeTab === tab ? '#3b82f6' : '#9ca3af',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(59, 130, 246, 0.1)';
              (e.target as HTMLButtonElement).style.color = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = activeTab === tab ? 'rgba(59, 130, 246, 0.2)' : 'transparent';
              (e.target as HTMLButtonElement).style.color = activeTab === tab ? '#3b82f6' : '#9ca3af';
            }}
          >
            {tab}
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
        {activeTab === 'chat' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Messages */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px 20px',
                overflowY: 'auto',
              }}
            >
              {filteredMessages.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    color: '#6b7280',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>No messages yet</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Start a conversation with GitHub agents
                  </div>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <AgentMessageBubble
                    key={msg.id}
                    message={msg}
                    currentAgentId="user"
                    showTimestamp
                    showSender
                  />
                ))
              )}
            </div>

            {/* Message Input */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '16px 20px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderTop: '1px solid rgba(59, 130, 246, 0.1)',
              }}
            >
              <select
                value={activeAgentType}
                onChange={(e) => setActiveAgentType(e.target.value as AgentType | 'all')}
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">All Agents</option>
                {(['pr-agent', 'branch-conflict', 'bug-fix', 'dependency-update'] as AgentType[]).map((type) => (
                  <option key={type} value={type}>{type.replace('-', ' ')}</option>
                ))}
              </select>
              
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message to GitHub agents..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  fontSize: '14px',
                  resize: 'none',
                  minHeight: '44px',
                  maxHeight: '120px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                style={{
                  padding: '10px 16px',
                  background: newMessage.trim() 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' 
                    : 'rgba(59, 130, 246, 0.3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (newMessage.trim()) {
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.target as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <TaskAssignmentWidget
              tasks={githubTasks}
              onTaskCreate={() => setActiveTab('chat')}
              showEmptyState
            />
          </div>
        )}

        {activeTab === 'status' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '16px 20px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              GitHub Agents ({githubAgents.length})
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {githubAgents.map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                    }}
                  >
                    {agent.type === 'pr-agent' ? '📦' : 
                     agent.type === 'branch-conflict' ? '🌿' :
                     agent.type === 'bug-fix' ? '🐛' : '📦'}
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

            {/* Quick Actions */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '16px',
                borderTop: '1px solid rgba(59, 130, 246, 0.1)',
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
                Quick Actions
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                }}
              >
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '6px',
                      color: '#e0e0e0',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left' as const,
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'rgba(59, 130, 246, 0.2)';
                      (e.target as HTMLButtonElement).style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'rgba(59, 130, 246, 0.1)';
                      (e.target as HTMLButtonElement).style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    }}
                  >
                    <span>{action.icon}</span>
                    <div>
                      <div>{action.label}</div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#9ca3af',
                        }}
                      >
                        {action.description}
                      </div>
                    </div>
                  </button>
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

export const MemoizedGithubAgentPanel = React.memo(GithubAgentPanel);

// ==========================================================================
// Export
// ==========================================================================

export default GithubAgentPanel;
