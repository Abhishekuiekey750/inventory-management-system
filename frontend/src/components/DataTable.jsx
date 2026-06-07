import React from 'react';

function DataTable({
  headers,
  data = [],
  columns = [],
  loading = false,
  total = 0,
  page = 1,
  limit = 10,
  onPageChange
}) {
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            // Renders clean loading skeleton lines
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx}>
                {headers.map((_, hIdx) => (
                  <td key={hIdx}>
                    <div className="skeleton-line" style={{
                      height: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      animation: 'pulse 1.5s infinite ease-in-out'
                    }}></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Clean empty state indicator
            <tr>
              <td colSpan={headers.length} className="empty-state-cell" style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-muted)'
              }}>
                <div className="empty-state-content">
                  <p style={{ fontWeight: 500, fontSize: '1.1rem', marginBottom: '0.25rem' }}>No Data Available</p>
                  <p style={{ fontSize: '0.875rem' }}>Try refining your search filters or add new records.</p>
                </div>
              </td>
            </tr>
          ) : (
            // Actual Table Data
            data.map((row, rIdx) => (
              <tr key={row.id || rIdx}>
                {columns.map((col, cIdx) => (
                  <td key={cIdx}>
                    {typeof col === 'function' ? col(row) : row[col]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Bar */}
      {!loading && data.length > 0 && onPageChange && (
        <div className="table-pagination" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Page <strong>{page}</strong> of {totalPages} (Total {total} records)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.875rem',
                backgroundColor: page <= 1 ? 'transparent' : 'var(--bg-tertiary)',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.875rem',
                backgroundColor: page >= totalPages ? 'transparent' : 'var(--bg-tertiary)',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
