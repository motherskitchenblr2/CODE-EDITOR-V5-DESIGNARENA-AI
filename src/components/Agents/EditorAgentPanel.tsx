// ============================================================================
// Volt Code AGI - Editor Agent Panel Component
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { useSocket } from '../contexts/SocketProvider';
import { AgentState, AgentTask, TaskPriority, AgentTab } from '../../../shared/types';
import { AgentStatusBadge } from './AgentStatusBadge';
import { TaskAssignmentWidget } from './TaskAssignmentWidget';
import { AgentMessageBubble } from './AgentMessageBubble';

// ==========================================================================
// Props
// ==========================================================================

export interface EditorAgentPanelProps {
  className?: string;
}

// ==========================================================================
// Quick Action Configuration
// ==========================================================================

const QUICK_ACTIONS = [
  { label: 'Write Code', icon: '💻', description: 'Generate new code' },
  { label: 'Refactor', icon: '🔄', description: 'Refactor existing code' },
  { label: 'Security Scan', icon: '🔒', description: 'Scan for vulnerabilities' },
  { label: 'Monitor', icon: '📊', description: 'Monitor code quality' },
];

// ==========================================================================
// Component
// ==========================================================================

export function EditorAgentPanel({ className = '' }: EditorAgentPanelProps) {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'status'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  // Get editor agents
  const editorAgents = useMemo(() => {
    return socket.getAgentsByTab('editor');
  }, [socket]);

  // Get messages for editor agents
  const editorMessages = useMemo(() => {
    return socket.messages.filter((msg) => msg.tab === 'editor');
  }, [socket.messages]);

  // Get tasks for editor agents
  const editorTasks = useMemo(() => {
    return socket.tasks.filter((task) => task.tab === 'editor');
  }, [socket.tasks]);

  // Handle quick action
  const handleQuickAction = useCallback((action: string) => {
    const task: Partial<AgentTask> = {
      title: action,
      description: `Quick action: ${action}`,
      priority: 'medium',
      tab: 'editor',
      createdBy: 'user',
    };

    socket.emitAgentTaskCreate(task as any);
  }, [socket]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const message = {
      id: `msg-${Date.now()}`,
      from: 'user',
      to: 'editor-agent-001',
      content: newMessage,
      taskId: null,
      tab: 'editor' as AgentTab,
      timestamp: Date.now(),
      read: false,
    };

    socket.emitAgentMessage(message);
    setNewMessage('');
  }, [newMessage, socket]);

  // Handle create task
  const handleCreateTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;

    const task = {
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
      tab: 'editor' as AgentTab,
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
    return editorAgents.find((a) => a.status !== 'offline') || editorAgents[0];
  }, [editorAgents]);

  return (
    <div
      className={`editor-agent-panel ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 95, 31, 0.2)',
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
          background: 'rgba(255, 95, 31, 0.1)',
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
              background: 'linear-gradient(135deg, #FF5F1F 0%, #FF8C42 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            💻
          </div>
          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#e0e0e0',
              }}
            >
              Editor Tab
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#9ca3af',
              }}
            >
              Code writing, refactoring & implementation
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

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          padding: '0 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 95, 31, 0.1)',
        }}
      >
        {(['chat', 'tasks', 'status'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab ? 'rgba(255, 95, 31, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeTab === tab ? '#FF5F1F' : '#9ca3af',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
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
              {editorMessages.length === 0 ? (
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
                    Start a conversation with the Editor Agent
                  </div>
                </div>
              ) : (
                editorMessages.map((msg) => (
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
                borderTop: '1px solid rgba(255, 95, 31, 0.1)',
              }}
            >
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message to the Editor Agent..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 95, 31, 0.2)',
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
                  e.target.style.borderColor = '#FF5F1F';
                  e.target.style.boxShadow = '0 0 0 2px rgba(255, 95, 31, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 95, 31, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                style={{
                  padding: '10px 16px',
                  background: newMessage.trim() 
                    ? 'linear-gradient(135deg, #FF5F1F 0%, #FF8C42 100%)' 
                    : 'rgba(255, 95, 31, 0.3)',
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
                    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(255, 95, 31, 0.4)';
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
              tasks={editorTasks}
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
              Editor Agents ({editorAgents.length})
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {editorAgents.map((agent) => (
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
                      background: 'linear-gradient(135deg, #FF5F1F 0%, #FF8C42 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                    }}
                  >
                    💻
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
                      background: 'rgba(255, 95, 31, 0.1)',
                      border: '1px solid rgba(255, 95, 31, 0.2)',
                      borderRadius: '6px',
                      color: '#e0e0e0',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left' as const,
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'rgba(255, 95, 31, 0.2)';
                      (e.target as HTMLButtonElement).style.borderColor = '#FF5F1F';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'rgba(255, 95, 31, 0.1)';
                      (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 95, 31, 0.2)';
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

export const MemoizedEditorAgentPanel = React.memo(EditorAgentPanel);

// ==========================================================================
// Export
// ==========================================================================

export default EditorAgentPanel;
