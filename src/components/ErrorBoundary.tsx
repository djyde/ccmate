import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="font-medium mb-1 select-text">
                  {this.state.error?.message || "An unexpected error occurred"}
                </div>
                <div className="text-sm opacity-90 select-text">
                  Please try reloading the page or return to the home page.
                </div>
              </AlertDescription>
            </Alert>

            {this.state.error && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-sm">Stack Trace:</h3>
                <pre className="text-xs overflow-auto max-h-60 text-muted-foreground whitespace-pre-wrap break-words select-text cursor-text">
                  {this.state.error.stack || this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={this.handleReset} variant="default">
                Go to Home
              </Button>
              <Button onClick={this.handleReload} variant="outline">
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

