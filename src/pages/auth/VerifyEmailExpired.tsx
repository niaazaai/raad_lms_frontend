import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const VerifyEmailExpiredPage = () => {
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
          <Link
            to="/login"
            className="text-sm font-medium text-primary hover:text-primary-active"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-10">
        <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm md:p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <AlertCircle className="h-10 w-10 text-warning" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Link expired</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The verification link has expired or is invalid. Please request a new verification
            email.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/verify-email"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-active"
            >
              Request new link
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-primary hover:text-primary-active"
            >
              Back to sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default VerifyEmailExpiredPage;
