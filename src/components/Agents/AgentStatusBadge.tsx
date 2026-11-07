// ============================================================================
// Volt Code AGI - Agent Status Badge Component
// ============================================================================

import React, { useMemo } from 'react';
import { AgentStatus } from '../../../shared/types';

// ==========================================================================
// Props
// ==========================================================================

export interface AgentStatusBadgeProps {
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// ==========================================================================
// Status Configuration
// ==========================================================================

const STATUS_CONFIG: Record<AgentStatus, {
  label: string;
  color: string;
  bgColor: string;
  glow: string;
  icon: string;
}> = {
  idle: {
    label: 'Idle',
    color: '#10b981', // Green
    bgColor: 'rgba(16, 185, 129, 0.1)',
    glow: '0 0 10px rgba(16, 185, 129, 0.5)',
    icon: '✓',
  },
  busy: {
    label: 'Busy',
    color: '#3b82f6', // Blue
    bgColor: 'rgba(59, 130, 246, 0.1)',
    glow: '0 0 10px rgba(59, 130, 246, 0.5)',
    icon: '⏳',
  },
  error: {
    label: 'Error',
    color: '#ef4444', // Red
    bgColor: 'rgba(239, 68, 68, 0.1)',
    glow: '0 0 10px rgba(239, 68, 68, 0.5)',
    icon: '✗',
  },
  offline: {
    label: 'Offline',
    color: '#6b7280', // Gray
    bgColor: 'rgba(107, 114, 128, 0.1)',
    glow: 'none',
    icon: '○',
  },
};

// ==========================================================================
// Size Configuration
// ==========================================================================

const SIZE_CONFIG: Record<'sm' | 'md' | 'lg', {
  width: string;
  height: string;
  fontSize: string;
  labelFontSize: string;
  pulseSize: string;
}> = {
  sm: {
    width: '8px',
    height: '8px',
    fontSize: '8px',
    labelFontSize: '10px',
    pulseSize: '12px',
  },
  md: {
    width: '10px',
    height: '10px',
    fontSize: '10px',
    labelFontSize: '12px',
    pulseSize: '16px',
  },
  lg: {
    width: '12px',
    height: '12px',
    fontSize: '12px',
    labelFontSize: '14px',
    pulseSize: '20px',
  },
};

// ==========================================================================
// Component
// ==========================================================================

export function AgentStatusBadge({
  status,
  size = 'md',
  showLabel = false,
  className = '',
}: AgentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  const style: React.CSSProperties = useMemo(() => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: showLabel ? '6px' : '0',
    padding: showLabel ? '4px 8px' : '0',
    borderRadius: showLabel ? '12px' : '50%',
    backgroundColor: config.bgColor,
    color: config.color,
    fontSize: sizeConfig.fontSize,
    fontWeight: 600,
    boxShadow: config.glow,
    transition: 'all 0.2s ease',
    cursor: 'default',
    ...(showLabel && { border: `1px solid ${config.color}20` }),
  }), [status, size, showLabel, config, sizeConfig]);

  const pulseStyle: React.CSSProperties = useMemo(() => ({
    width: sizeConfig.pulseSize,
    height: sizeConfig.pulseSize,
    borderRadius: '50%',
    backgroundColor: config.color,
    opacity: 0.3,
    animation: status === 'busy' ? 'pulse 2s infinite' : 'none',
    position: 'absolute',
    pointerEvents: 'none',
  }), [status, sizeConfig, config]);

  const tooltipText = useMemo(() => {
    return `${config.label} - ${status === 'busy' ? 'Processing task' : status === 'error' ? 'Encountered error' : status === 'offline' ? 'Not connected' : 'Ready for task'}`;
  }, [status, config]);

  return (
    <div
      className={`agent-status-badge ${status} ${size} ${className}`}
      style={style}
      title={tooltipText}
      role="status"
      aria-label={`Agent status: ${config.label}`}
    >
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <span>{config.icon}</span>
        {status === 'busy' && <span style={pulseStyle} />}
      </span>
      {showLabel && <span style={{ fontSize: sizeConfig.labelFontSize }}>{config.label}</span>}
      
      {/* CSS Animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ==========================================================================
// Memoized Component
// ==========================================================================

export const MemoizedAgentStatusBadge = React.memo(AgentStatusBadge);

// ==========================================================================
// Export
// ==========================================================================

export default AgentStatusBadge;
