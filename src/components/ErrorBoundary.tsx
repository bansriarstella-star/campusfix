import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getReadableFirebaseError } from '../lib/firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const readable = this.state.error
        ? getReadableFirebaseError(this.state.error)
        : 'An unexpected application error occurred.';

      return (
        <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-[#0F1F3D]">Something went wrong</h1>
                <p className="mt-1 text-sm text-slate-600 break-words">{readable}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.assign('/');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F1F3D] text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-[#1E3354] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
