import { useNavigate, Link } from "react-router-dom";
import { Home, ArrowLeft, ShieldOff } from "lucide-react";

/**
 * 403 Unauthorized Page
 */
const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-layout-body px-4">
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-danger/10">
          <ShieldOff className="h-12 w-12 text-danger" />
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-danger">403</h1>

        {/* Message */}
        <h2 className="mt-4 text-2xl font-semibold text-foreground">Access Denied</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          You don't have permission to access this page. Please contact your administrator if you
          believe this is a mistake.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-active"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
