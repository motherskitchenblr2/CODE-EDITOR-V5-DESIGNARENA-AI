// ============================================================================
// Volt Code AGI - Agent Message Bubble Component
// ============================================================================

import React, { useMemo } from 'react';
import { AgentMessagePayload } from '../../../shared/types';
import { AgentStatusBadge } from './AgentStatusBadge';

// ==========================================================================
// Props
// ==========================================================================

export interface AgentMessageBubbleProps {
  message: AgentMessagePayload;
  currentAgentId?: string;
  showTimestamp?: boolean;
  showSender?: boolean;
  className?: string;
}

// ==========================================================================
// Component
// ==========================================================================

export function AgentMessageBubble({
  message,
  currentAgentId,
  showTimestamp = true,
  showSender = true,
  className = '',
}: AgentMessageBubbleProps) {
  const isOwnMessage = useMemo(() => {
    return message.from === currentAgentId || message.from === 'user';
  }, [message.from, currentAgentId]);

  const formattedTimestamp = useMemo(() => {
    if (!showTimestamp) return '';
    const date = new Date(message.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.timestamp, showTimestamp]);

  const bubbleStyle: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
    gap: '4px',
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '12px',
    backgroundColor: isOwnMessage 
      ? 'rgba(59, 130, 246, 0.15)' 
      : 'rgba(107, 114, 128, 0.15)',
    border: isOwnMessage 
      ? '1px solid rgba(59, 130, 246, 0.3)' 
      : '1px solid rgba(107, 114, 128, 0.3)',
    color: '#e0e0e0',
    fontSize: '14px',
    lineHeight: '1.4',
    wordWrap: 'break-word',
    position: 'relative',
  }), [isOwnMessage]);

  const senderStyle: React.CSSProperties = useMemo(() => ({
    fontSize: '11px',
    fontWeight: 600,
    color: isOwnMessage ? '#60a5fa' : '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '2px',
  }), [isOwnMessage]);

  const timestampStyle: React.CSSProperties = useMemo(() => ({
    fontSize: '10px',
    color: '#6b7280',
    marginTop: '2px',
    textAlign: isOwnMessage ? 'right' : 'left',
  }), [isOwnMessage]);

  const messageStyle: React.CSSProperties = useMemo(() => ({
    fontSize: '13px',
    color: '#e0e0e0',
    whiteSpace: 'pre-wrap',
  }), []);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  }), []);

  return (
    <div
      className={`agent-message-bubble ${isOwnMessage ? 'own' : 'other'} ${className}`}
      style={containerStyle}
      role="article"
      aria-label={`Message from ${message.from}`}
    >
      {showSender && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AgentStatusBadge status={isOwnMessage ? 'busy' : 'idle'} size="sm" />
          <span style={senderStyle}>{message.from}</span>
        </div>
      )}
      
      <div style={bubbleStyle}>
        <div style={messageStyle}>{message.content}</div>
        {showTimestamp && formattedTimestamp && (
          <div style={timestampStyle}>{formattedTimestamp}</div>
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// Memoized Component
// ==========================================================================

export const MemoizedAgentMessageBubble = React.memo(AgentMessageBubble);

// ==========================================================================
// Export
// ==========================================================================

export default AgentMessageBubble;
