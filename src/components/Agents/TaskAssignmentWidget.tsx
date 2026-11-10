// ============================================================================
// Volt Code AGI - Task Assignment Widget Component
// ============================================================================

import React, { useMemo, useState } from 'react';
import { AgentTask, TaskStatus, TaskPriority } from '../../../shared/types';
import { AgentStatusBadge } from './AgentStatusBadge';

// ==========================================================================
// Props
// ==========================================================================

export interface TaskAssignmentWidgetProps {
  tasks: AgentTask[];
  onTaskSelect?: (task: AgentTask) => void;
  onTaskCreate?: () => void;
  showEmptyState?: boolean;
  className?: string;
}

// ==========================================================================
// Status Configuration
// ==========================================================================

const STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: 'Pending',
    color: '#fbbf24', // Amber
    bgColor: 'rgba(251, 191, 36, 0.15)',
  },
  assigned: {
    label: 'Assigned',
    color: '#3b82f6', // Blue
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  'in-progress': {
    label: 'In Progress',
    color: '#8b5cf6', // Purple
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  completed: {
    label: 'Completed',
    color: '#10b981', // Green
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  failed: {
    label: 'Failed',
    color: '#ef4444', // Red
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6b7280', // Gray
    bgColor: 'rgba(107, 114, 128, 0.15)',
  },
};

const PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  color: string;
  icon: string;
}> = {
  critical: {
    label: 'Critical',
    color: '#ef4444',
    icon: '🔴',
  },
  high: {
    label: 'High',
    color: '#f59e0b',
    icon: '🟠',
  },
  medium: {
    label: 'Medium',
    color: '#fbbf24',
    icon: '🟡',
  },
  low: {
    label: 'Low',
    color: '#10b981',
    icon: '🟢',
  },
};

// ==========================================================================
// Component
// ==========================================================================

export function TaskAssignmentWidget({
  tasks,
  onTaskSelect,
  onTaskCreate,
  showEmptyState = true,
  className = '',
}: TaskAssignmentWidgetProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const activeTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'completed');
  }, [tasks]);

  const taskStats = useMemo(() => {
    const stats: Record<TaskStatus, number> = {
      pending: 0,
      assigned: 0,
      'in-progress': 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    tasks.forEach((task) => {
      stats[task.status]++;
    });

    return stats;
  }, [tasks]);

  const handleTaskClick = (task: AgentTask) => {
    setExpandedTask(expandedTask === task.id ? null : task.id);
    onTaskSelect?.(task);
  };

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (showEmptyState && tasks.length === 0) {
    return (
      <div
        className={`task-assignment-widget empty ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          color: '#6b7280',
          textAlign: 'center',
          minHeight: '200px',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>No tasks yet</div>
        <div style={{ fontSize: '13px', marginTop: '8px' }}>
          Tasks will appear here when assigned to agents
        </div>
        {onTaskCreate && (
          <button
            onClick={onTaskCreate}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #FF5F1F 0%, #FF8C42 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(255, 95, 31, 0.4)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.target as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            Create Task
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`task-assignment-widget ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
      }}
    >
      {/* Stats Bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '12px 16px',
          background: 'rgba(255, 95, 31, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 95, 31, 0.2)',
          flexWrap: 'wrap',
        }}
      >
        {Object.entries(taskStats).map(([status, count]) => {
          if (count === 0) return null;
          const config = STATUS_CONFIG[status as TaskStatus];
          return (
            <div
              key={status}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: config.bgColor,
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: config.color,
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: config.color }} />
              <span>{config.label}</span>
              <span style={{ color: '#9ca3af' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '0 4px',
            }}
          >
            Active Tasks ({activeTasks.length})
          </div>

          {activeTasks.map((task) => {
            const statusConfig = STATUS_CONFIG[task.status];
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const isExpanded = expandedTask === task.id;

            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: `1px solid ${statusConfig.color}20`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  // @ts-ignore
                  ':hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: statusConfig.color,
                  },
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.05)';
                  (e.target as HTMLDivElement).style.borderColor = statusConfig.color;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.02)';
                  (e.target as HTMLDivElement).style.borderColor = `${statusConfig.color}20`;
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flex: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: statusConfig.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      {statusConfig.label.charAt(0)}
                    </div>
                    
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#e0e0e0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        padding: '2px 8px',
                        background: priorityConfig.bgColor,
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: priorityConfig.color,
                      }}
                    >
                      {priorityConfig.icon} {priorityConfig.label}
                    </div>
                    
                    {task.agentId && (
                      <div
                        style={{
                          padding: '2px 8px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: '#60a5fa',
                        }}
                      >
                        {task.agentType}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: '10px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDate(task.createdAt)}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#d1d5db',
                    }}
                  >
                    <div><strong>Description:</strong> {task.description}</div>
                    <div><strong>Priority:</strong> {priorityConfig.label}</div>
                    <div><strong>Status:</strong> {statusConfig.label}</div>
                    <div><strong>Tab:</strong> {task.tab}</div>
                    {task.agentId && <div><strong>Assigned to:</strong> {task.agentId}</div>}
                    {task.assignedAt && <div><strong>Assigned at:</strong> {formatDate(task.assignedAt)}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '0 4px',
            }}
          >
            Completed Tasks ({completedTasks.length})
          </div>

          {completedTasks.slice(0, 3).map((task) => {
            const priorityConfig = PRIORITY_CONFIG[task.priority];

            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#10b981',
                  }}
                >
                  ✓
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#9ca3af',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {task.title}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#6b7280',
                  }}
                >
                  {formatDate(task.completedAt)}
                </div>
              </div>
            );
          })}

          {completedTasks.length > 3 && (
            <div
              style={{
                fontSize: '11px',
                color: '#6b7280',
                textAlign: 'center',
                padding: '8px',
              }}
            >
              +{completedTasks.length - 3} more completed tasks
            </div>
          )}
        </div>
      )}

      {onTaskCreate && activeTasks.length === 0 && (
        <button
          onClick={onTaskCreate}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #FF5F1F 0%, #FF8C42 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            alignSelf: 'center',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(255, 95, 31, 0.4)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.target as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          Create New Task
        </button>
      )}
    </div>
  );
}

// ==========================================================================
// Memoized Component
// ==========================================================================

export const MemoizedTaskAssignmentWidget = React.memo(TaskAssignmentWidget);

// ==========================================================================
// Export
// ==========================================================================

export default TaskAssignmentWidget;
