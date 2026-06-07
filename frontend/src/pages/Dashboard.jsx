import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboard';
import { toast } from 'react-toastify';
import { LayoutDashboard, Users, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getStats({ low_stock_threshold: 10 });
      setStats(data);
    } catch (err) {
      toast.error(`Failed to load stats: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  const statCards = [
    { name: 'Total Products', value: stats?.total_products, icon: LayoutDashboard, color: 'var(--accent-primary)' },
    { name: 'Total Customers', value: stats?.total_customers, icon: Users, color: 'var(--accent-secondary)' },
    { name: 'Total Orders', value: stats?.total_orders, icon: ShoppingCart, color: 'var(--accent-warning)' },
    { name: 'Total Inventory Value', value: stats?.total_inventory_value, icon: DollarSign, color: 'var(--accent-success)', isCurrency: true },
    { name: 'Low Stock Count', value: stats?.low_stock_count, icon: AlertTriangle, color: stats?.low_stock_count > 0 ? 'var(--accent-danger)' : 'var(--text-muted)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', margin: 0, fontWeight: 600 }}>Overview Metrics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>Real-time inventory valuation and transaction tracking.</p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="btn-secondary"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color var(--transition-fast)'
          }}
          onMouseOver={(e) => { if (!loading) e.target.style.backgroundColor = 'rgba(255,255,255,0.02)' }}
          onMouseOut={(e) => { if (!loading) e.target.style.backgroundColor = 'var(--bg-secondary)' }}
        >
          {loading ? 'Refreshing...' : 'Refresh Stats'}
        </button>
      </div>

      {/* Grid Cards Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem'
      }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="card" style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{card.name}</span>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
              </div>
              {loading ? (
                <div className="skeleton-line" style={{
                  height: '32px',
                  width: '60%',
                  margin: '0.5rem 0',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  animation: 'pulse 1.5s infinite ease-in-out'
                }}></div>
              ) : (
                <span style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  color: card.name === 'Low Stock Count' && card.value > 0 ? 'var(--accent-danger)' : 'var(--text-primary)',
                  letterSpacing: '-0.02em'
                }}>
                  {card.isCurrency ? formatCurrency(card.value) : card.value}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Low Stock Warn monitor Table */}
      <div className="card" style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} style={{ color: stats?.low_stock_count > 0 ? 'var(--accent-danger)' : 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', margin: 0, fontWeight: 600 }}>Low Stock Alert Monitor</h3>
        </div>

        {loading ? (
          <div className="skeleton-line" style={{
            height: '100px',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            animation: 'pulse 1.5s infinite ease-in-out'
          }}></div>
        ) : !stats || stats.low_stock_products.length === 0 ? (
          <div style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.01)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)'
          }}>
            <p style={{ fontWeight: 600, color: 'var(--accent-success)', fontSize: '1rem', marginBottom: '4px' }}>All items are fully stocked!</p>
            <p style={{ fontSize: '0.8125rem' }}>No products currently sit below the low-stock safety threshold (10 units).</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Product Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>SKU</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Stock Qty</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_products.map((prod) => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{prod.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{prod.sku}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{formatCurrency(prod.price)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--accent-danger)',
                        fontWeight: 600,
                        fontSize: '0.8125rem'
                      }}>
                        {prod.quantity_in_stock} left
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
