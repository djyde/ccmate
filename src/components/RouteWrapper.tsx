import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Loader, Center } from "@mantine/core";
import { QueryErrorFallback } from "./QueryErrorFallback";

function LoadingFallback() {
	return (
		<Center mih="100vh">
			<Loader size="sm" />
		</Center>
	);
}

interface RouteWrapperProps {
	children: ReactNode;
}

export function RouteWrapper({ children }: RouteWrapperProps) {
	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<ErrorBoundary
					onReset={reset}
					fallbackRender={({ error, resetErrorBoundary }: FallbackProps) => (
						<QueryErrorFallback
							error={error}
							resetErrorBoundary={resetErrorBoundary}
						/>
					)}
				>
					<Suspense fallback={<LoadingFallback />}>{children}</Suspense>
				</ErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
}
