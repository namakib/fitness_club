import { Component } from 'react';
import t from '../theme';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${t.pageBg} ${t.pageText}`}>
          <div className={`max-w-md w-full rounded-xl shadow-lg border p-6 ${t.cardBg} ${t.cardBorder}`}>
            <h1 className={`text-lg font-semibold mb-2 ${t.dangerText}`}>
              Something went wrong
            </h1>
            <p className={`text-sm mb-4 font-mono break-all ${t.pageTextMuted}`}>
              {error?.message || String(error)}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className={t.btn}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
