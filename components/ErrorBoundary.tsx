import React from 'react';

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-white/60">
              The application encountered a critical error. This is often caused by backend connectivity issues or plan limits.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 h-11 rounded-full bg-white text-black font-bold"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
