import React, { Component, ErrorInfo, ReactNode } from "react";

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
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-10 bg-red-900 text-white min-h-screen">
                    <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
                    <div className="bg-black/50 p-4 rounded mb-4 font-mono text-sm whitespace-pre-wrap">
                        {this.state.error?.toString()}
                    </div>
                    <div className="bg-black/30 p-4 rounded font-mono text-xs whitespace-pre-wrap">
                        {this.state.errorInfo?.componentStack}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
