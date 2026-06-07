import React from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

function OrderDetailsModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Order Status & ID */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>ORDER ID</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{order.id}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Customer Info */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            Customer Information
          </h4>
          {order.customer ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
              <p><strong>Name:</strong> {order.customer.full_name}</p>
              <p><strong>Email:</strong> {order.customer.email}</p>
              <p><strong>Phone:</strong> {order.customer.phone || 'N/A'}</p>
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Customer details unavailable.</p>
          )}
        </div>

        {/* Order Items Table */}
        <div>
          <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            Items Summary
          </h4>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Product ID</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                        {item.product_id}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>${parseFloat(item.unit_price).toFixed(2)}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                        ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Date */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1rem',
          marginTop: '0.5rem'
        }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER PLACED</p>
            <p style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>{formatDate(order.created_at)}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LAST UPDATED</p>
            <p style={{ fontSize: '0.8125rem' }}>{formatDate(order.updated_at)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL AMOUNT</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>
              ${parseFloat(order.total_amount).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Footer Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background-color var(--transition-fast)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.04)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
          >
            Close
          </button>
        </div>

      </div>
    </Modal>
  );
}

export default OrderDetailsModal;
