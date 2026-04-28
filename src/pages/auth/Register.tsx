import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed } from "iconoir-react";
import { Button, Input, Label } from "@/components/ui";
import { RegisterSchema, type RegisterFormData } from "@/data/models/User";
import { callApi, fetchCsrfCookie } from "@/services";
import { API_ENDPOINTS } from "@/data/constants/endpoints";
import { RequestMethod } from "@/data/constants/methods";
import { cn } from "@/lib/utils";
import PixelBlast from "@/components/ui/pixel-blast";

/** Same light card scope as login — readable controls when app theme is dark. */
const authFormLightScope =
  "[color-scheme:light] text-foreground [--background:#ffffff] [--foreground:#071437] [--muted-foreground:#64748b] [--border:#e5e7eb] [--input:#e5e7eb] [--ring:#0069B4] [--card:#ffffff] [--accent:#f1f5f9] [--accent-foreground:#071437] [--secondary-foreground:#071437]";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await fetchCsrfCookie();
      const response = await callApi({
        url: API_ENDPOINTS.AUTH.REGISTER,
        method: RequestMethod.POST,
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          password_confirmation: data.password_confirmation,
        },
      });

      const body = response.data as { message?: string; email?: string };

      if (response.ok) {
        navigate("/verify-email", {
          replace: true,
          state: { email: body?.email ?? data.email },
        });
      } else {
        setSubmitError((body?.message as string) || "Registration failed. Please try again.");
      }
    } catch {
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 z-0">
        <PixelBlast
          variant="diamond"
          pixelSize={3}
          color="#0960f0"
          patternScale={3}
          patternDensity={2}
          enableRipples
          rippleSpeed={0.25}
          rippleThickness={0.21}
          rippleIntensityScale={1}
          speed={0.5}
          transparent
          edgeFade={0.1}
        />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div
          className={cn(
            "mx-auto w-full max-w-md rounded-2xl border border-border/50 bg-white/95 p-6 shadow-xl backdrop-blur-sm md:p-8",
            authFormLightScope
          )}
        >
          <div className="mb-2">
            <div className="mb-6 flex flex-col items-center justify-center text-center">
              <img src="/logo.png" alt="Raad LMS" className="w-56 object-contain md:w-64" />
            </div>

            <div className="mb-6 space-y-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground">
                We&apos;ll send a verification link to confirm your email.
              </p>
            </div>

            <Button variant="outline" className="h-11 w-full font-medium shadow-sm" asChild>
              <a href="/auth/google" className="gap-2">
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                Continue with Google
              </a>
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-muted-foreground">Or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {submitError && (
                <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
                  {submitError}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  aria-invalid={!!errors.name}
                  className={cn(
                    "h-11 border bg-white px-4 py-3 shadow-sm",
                    errors.name ? "border-danger" : "border-input"
                  )}
                  {...register("name")}
                />
                {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  className={cn(
                    "h-11 border bg-white px-4 py-3 shadow-sm",
                    errors.email ? "border-danger" : "border-input"
                  )}
                  {...register("email")}
                />
                {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    aria-invalid={!!errors.password}
                    className={cn(
                      "h-11 border bg-white px-4 py-3 pr-12 shadow-sm",
                      errors.password ? "border-danger" : "border-input"
                    )}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeClosed className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-danger">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  aria-invalid={!!errors.password_confirmation}
                  className={cn(
                    "h-11 border bg-white px-4 py-3 shadow-sm",
                    errors.password_confirmation ? "border-danger" : "border-input"
                  )}
                  {...register("password_confirmation")}
                />
                {errors.password_confirmation && (
                  <p className="text-sm text-danger">{errors.password_confirmation.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:text-primary-active">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
