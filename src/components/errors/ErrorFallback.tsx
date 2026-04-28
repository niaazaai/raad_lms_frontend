import { FallbackProps } from "react-error-boundary";
import { WarningTriangle, Refresh } from "iconoir-react";

/**
 * Error Fallback Component
 *
 * Displayed when an unhandled error occurs in the app.
 * Used with react-error-boundary.
 */
const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-layout-body px-4">
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
          <WarningTriangle className="h-10 w-10 text-danger" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>

        {/* Error Details (only in development) */}
        {import.meta.env.DEV && error && (
          <div className="mt-4 max-w-lg rounded-lg bg-muted p-4 text-left">
            <p className="text-sm font-medium text-danger">{error.message}</p>
            {error.stack && (
              <pre className="mt-2 max-h-40 overflow-auto text-xs text-muted-foreground">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-active"
          >
            <Refresh className="h-4 w-4" />
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
