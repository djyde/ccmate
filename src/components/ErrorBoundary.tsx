import { AlertCircle } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Button, Code, Paper, Text } from "@mantine/core";

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
				<div className="min-h-screen flex items-center justify-center p-4">
					<div className="max-w-2xl w-full space-y-4">
						<Alert
							color="red"
							icon={<AlertCircle className="h-4 w-4" />}
							title="Something went wrong"
						>
							<Text size="sm" fw={500} mb={4} style={{ userSelect: "text" }}>
								{this.state.error?.message || "An unexpected error occurred"}
							</Text>
							<Text size="sm" opacity={0.9} style={{ userSelect: "text" }}>
								Please try reloading the page or return to the home page.
							</Text>
						</Alert>

						{this.state.error && (
							<Paper p="md" radius="md" bg="var(--mantine-color-default-hover)">
								<Text size="sm" fw={600} mb="xs">Stack Trace:</Text>
								<Code
									block
									style={{
										maxHeight: 240,
										overflow: "auto",
										userSelect: "text",
										cursor: "text",
										whiteSpace: "pre-wrap",
										wordBreak: "break-word",
									}}
								>
									{this.state.error.stack || this.state.error.toString()}
									{this.state.errorInfo?.componentStack}
								</Code>
							</Paper>
						)}

						<div className="flex gap-3">
							<Button onClick={this.handleReset}>
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
