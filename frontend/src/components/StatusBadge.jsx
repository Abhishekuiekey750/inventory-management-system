import React from 'react';

function StatusBadge({ status }) {
  const normalizedStatus = (status || 'PENDING').toUpperCase();

  // Status-specific color configurations
  const statusStyles = {
    PENDING: {
      bg: 'rgba(245, 158, 11, 0.12)',
      color: 'var(--accent-warning)',
      border: 'rgba(245, 158, 11, 0.25)'
    },
    CONFIRMED: {
      bg: 'rgba(6, 182, 212, 0.12)',
      color: 'var(--accent-secondary)',
      border: 'rgba(6, 182, 212, 0.25)'
    },
    SHIPPED: {
      bg: 'rgba(99, 102, 241, 0.12)',
      color: 'var(--accent-primary)',
      border: 'rgba(99, 102, 241, 0.25)'
    },
    DELIVERED: {
      bg: 'rgba(16, 185, 129, 0.12)',
      color: 'var(--accent-success)',
      border: 'rgba(16, 185, 129, 0.25)'
    },
    CANCELLED: {
      bg: 'rgba(239, 68, 68, 0.12)',
      color: 'var(--accent-danger)',
      border: 'rgba(239, 68, 68, 0.25)'
    }
  };

  const style = statusStyles[normalizedStatus] || statusStyles.PENDING;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.625rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      borderRadius: '50px',
      backgroundColor: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {normalizedStatus}
    </span>
  );
}

export default StatusBadge;
