import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface QueryErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export function QueryErrorFallback({ error, resetErrorBoundary }: QueryErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load data</AlertTitle>
          <AlertDescription className="select-text">
            {error.message || "An unexpected error occurred while fetching data."}
          </AlertDescription>
        </Alert>

        {resetErrorBoundary && (
          <div className="flex gap-3">
            <Button onClick={resetErrorBoundary} variant="default">
              Try Again
            </Button>
            <Button onClick={() => window.location.href = "/"} variant="outline">
              Go to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

