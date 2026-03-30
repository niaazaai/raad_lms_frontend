import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { LoginSchema, LoginFormData, getDashboardPath } from "@/data/models/User";
import { useAuth } from "@/features/auth";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
import { AUTH_BASE_URL } from "@/services/apiClient";
import LoginWith2FA from "./LoginWith2FA";

const SLOGAN = "Fresh food, delivered to your door.";
const FOOD_BG =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, pending2FA } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectParam = searchParams.get("redirect");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      if (result === true) {
        const user = useAuthStore.getState().user;
        const target = redirectParam ?? getDashboardPath(user?.type ?? "customer");
        navigate(target, { replace: true });
      } else if (result === "requires_2fa") {
        // 2FA form will be shown via pending2FA state
      } else {
        const currentError = useAuthStore.getState().error;
        setError("email", {
          type: "manual",
          message: currentError || "Invalid email or password",
        });
      }
    } catch {
      const currentError = useAuthStore.getState().error;
      setError("email", {
        type: "manual",
        message: currentError || "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show 2FA form when pending — keep centered for quick verification flow
  if (pending2FA) {
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
            <Link to="/" className="text-sm font-medium text-primary hover:text-primary-active">
              Home
            </Link>
          </nav>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-10">
          <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
            <LoginWith2FA />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Login card */}
      <div className="flex w-full flex-col bg-background lg:w-1/2">
         

        <main className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="mt-2 text-muted-foreground">
                Sign in to access your dashboard and manage your account.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={cn(
                    "w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors",
                    "placeholder:text-muted-foreground",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    errors.email ? "border-danger" : "border-input"
                  )}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-danger">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={cn(
                      "w-full rounded-lg border bg-background px-4 py-3 pr-12 text-sm outline-none transition-colors",
                      "placeholder:text-muted-foreground",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20",
                      errors.password ? "border-danger" : "border-input"
                    )}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-danger">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    {...register("remember")}
                  />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-active"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground",
                  "transition-colors hover:bg-primary-active",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <a
                href={`${AUTH_BASE_URL}/auth/google`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </a>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium text-primary hover:text-primary-active">
                Sign up
              </Link>
            </p>
          </div>
        </main>
      </div>

      {/* Right: Branded panel with food background */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-8 lg:p-12 overflow-hidden"
        aria-hidden
      >
        {/* Food background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${FOOD_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* Logo + slogan overlay */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Raad LMS"
              className="h-12 w-12 object-contain drop-shadow-lg"
            />
            <div>
              <span className="text-2xl font-bold text-white drop-shadow-md">
                Raad <span className="text-primary">LMS</span>
              </span>
              <p className="text-sm text-white/90 mt-0.5">{SLOGAN}</p>
            </div>
          </div>
        </div>

        {/* CTA at bottom */}
        <div className="relative z-10 space-y-4">
          <p className="text-sm text-white/90 max-w-xs">
            Don&apos;t have an account yet? Create one and get started.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white/40 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/60"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
