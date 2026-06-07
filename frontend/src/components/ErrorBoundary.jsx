import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          margin: '2rem auto',
          maxWidth: '600px',
        }}>
          <h2 style={{ color: 'var(--accent-danger)', marginBottom: '1rem' }}>Something went wrong.</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {this.state.error?.message || "An unexpected rendering or script error occurred."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'var(--accent-primary-hover)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'var(--accent-primary)'}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
