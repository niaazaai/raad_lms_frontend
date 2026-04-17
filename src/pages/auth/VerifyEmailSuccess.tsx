import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store";
import { useAuth } from "@/features/auth";
import { getDashboardPath } from "@/data/models/User";

const VerifyEmailSuccessPage = () => {
  const navigate = useNavigate();
  const { fetchUser } = useAuthStore();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchUser().then(() => {
      const user = useAuthStore.getState().user;
      if (user) {
        navigate(getDashboardPath(user.type ?? "student"), { replace: true });
      }
    });
  }, [fetchUser, navigate]);

  return (
    <div className="min-h-screen bg-layout-body flex flex-col">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            Raad LMS
          </Link>
          {isAuthenticated && user ? (
            <Link
              to={getDashboardPath(user.type ?? "student")}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-active"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span>{user.name?.split(" ")[0] ?? "Dashboard"}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-primary hover:text-primary-active"
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-10">
        <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm md:p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Email verified!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your email has been verified. You can now sign in to your account.
          </p>

          <Link
            to="/dashboard"
            className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-active"
          >
            Continue to dashboard
          </Link>
        </section>
      </main>
    </div>
  );
};

export default VerifyEmailSuccessPage;
