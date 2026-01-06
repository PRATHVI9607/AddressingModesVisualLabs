'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console for debugging
    console.group('🔴 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `Error: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-gray-800 rounded-xl border border-red-500/50 overflow-hidden">
            <div className="bg-red-500/20 px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="text-red-400" size={24} />
              <h2 className="text-xl font-semibold text-red-400">Something went wrong</h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                An error occurred while rendering this component. 
                This could be due to invalid data or a bug in the application.
              </p>
              
              {this.state.error && (
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">Error Message:</div>
                  <code className="block bg-gray-900 p-3 rounded-lg text-red-400 text-sm overflow-x-auto">
                    {this.state.error.message}
                  </code>
                </div>
              )}

              {this.state.errorInfo && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                    Show component stack
                  </summary>
                  <pre className="mt-2 bg-gray-900 p-3 rounded-lg text-xs text-gray-500 overflow-x-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
                <button
                  onClick={this.handleCopyError}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Copy size={16} />
                  Copy Error
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to access error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
