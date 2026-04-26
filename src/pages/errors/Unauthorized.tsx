import { PermissionDeniedCard } from "@/features/auth";

/**
 * Standalone 403 route — same messaging as in-dashboard permission gates.
 */
const UnauthorizedPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-layout-body px-4">
      <PermissionDeniedCard homeHref="/dashboard" />
    </div>
  );
};

export default UnauthorizedPage;
