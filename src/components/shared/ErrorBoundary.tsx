import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-bg-app flex min-h-screen items-center justify-center">
          <div className="card-surface max-w-md p-8 text-center">
            <h2 className="font-heading text-text-primary mb-2 text-xl font-semibold">
              Something went wrong
            </h2>
            <p className="text-text-secondary mb-4 text-sm">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
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
