import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border border-rose-200 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">
                {this.props.fallbackTitle || 'Page Rendering Error'}
              </h2>
              <p className="text-xs text-slate-500">
                Is view ko load karne me ek runtime issue aaya.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-900 text-rose-300 font-mono text-[11px] text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              {this.props.onReset && (
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
