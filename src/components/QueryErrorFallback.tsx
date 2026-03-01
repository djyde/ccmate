import { AlertCircle } from "lucide-react";
import { Alert, Button } from "@mantine/core";

interface QueryErrorFallbackProps {
	error: Error;
	resetErrorBoundary?: () => void;
}

export function QueryErrorFallback({
	error,
	resetErrorBoundary,
}: QueryErrorFallbackProps) {
	return (
		<div className="flex items-center justify-center min-h-screen p-4">
			<div className="max-w-md w-full space-y-4">
				<Alert
					color="red"
					icon={<AlertCircle className="h-4 w-4" />}
					title="Failed to load data"
				>
					<span className="select-text">
						{error.message ||
							"An unexpected error occurred while fetching data."}
					</span>
				</Alert>

				{resetErrorBoundary && (
					<div className="flex gap-3">
						<Button onClick={resetErrorBoundary}>
							Try Again
						</Button>
						<Button
							onClick={() => (window.location.href = "/")}
							variant="outline"
						>
							Go to Home
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
