import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { callApi, fetchCsrfCookie } from "@/services";
import { API_ENDPOINTS } from "@/data/constants/endpoints";
import { RequestMethod } from "@/data/constants/methods";
import { toast } from "sonner";

const VerifyEmailPage = () => {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? "";
  const [resendEmail, setResendEmail] = useState(email);
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    const targetEmail = resendEmail || email;
    if (!targetEmail) {
      toast.error("Please enter your email address");
      return;
    }
    setIsResending(true);
    try {
      await fetchCsrfCookie();
      const response = await callApi({
        url: API_ENDPOINTS.AUTH.EMAIL_RESEND,
        method: RequestMethod.POST,
        data: { email: targetEmail },
      });
      const body = response.data as { success?: boolean; message?: string };
      if (response.ok && body?.success !== false) {
        toast.success(body?.message ?? "Verification link sent. Check your email.");
      } else {
        toast.error(body?.message ?? "Failed to send verification email.");
      }
    } catch {
      toast.error("Failed to send verification email.");
    } finally {
      setIsResending(false);
    }
  };

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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Verify your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve sent a verification link to{" "}
            <strong className="text-foreground">{email || "your email"}</strong>. Click the link in
            the email to verify your account and sign in.
          </p>

          <div className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground">Didn&apos;t receive the email?</p>
            <div className="flex flex-col gap-2">
              {!email && (
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="rounded-lg border border-input bg-background px-4 py-2 text-sm"
                />
              )}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active disabled:opacity-50"
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Resend verification email"
                )}
              </button>
            </div>
          </div>

          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-active"
          >
            Back to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default VerifyEmailPage;
