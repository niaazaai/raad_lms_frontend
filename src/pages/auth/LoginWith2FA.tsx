import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useAuthStore } from "@/store";
import { getDashboardPath } from "@/data/models/User";
import { callApi, fetchCsrfCookie } from "@/services";
import { API_ENDPOINTS } from "@/data/constants/endpoints";
import { RequestMethod } from "@/data/constants/methods";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as z from "zod";

const TwoFactorSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});

type TwoFactorFormData = z.infer<typeof TwoFactorSchema>;

const LoginWith2FA = () => {
  const navigate = useNavigate();
  const { verify2FA, pending2FA, setPending2FA } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(TwoFactorSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (data: TwoFactorFormData) => {
    if (!pending2FA) return;
    setIsSubmitting(true);
    try {
      const success = await verify2FA(pending2FA.token, data.code);
      if (success) {
        const user = useAuthStore.getState().user;
        navigate(getDashboardPath(user?.type ?? "student"), { replace: true });
      } else {
        const currentError = useAuthStore.getState().error;
        setError("code", { type: "manual", message: currentError || "Invalid code" });
      }
    } catch {
      setError("code", { type: "manual", message: "Verification failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pending2FA) return;
    setIsResending(true);
    try {
      await fetchCsrfCookie();
      const response = await callApi({
        url: API_ENDPOINTS.AUTH.RESEND_2FA,
        method: RequestMethod.POST,
        data: { token: pending2FA.token },
      });
      if (response.ok) {
        toast.success("Code resent to your email");
      }
    } catch {
      // Error handled by callApi
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    setPending2FA(null);
  };

  if (!pending2FA) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">Two-Factor Authentication</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the 6-digit code sent to {pending2FA.email}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="code" className="block text-sm font-medium text-foreground">
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className={cn(
              "w-full rounded-lg border bg-background px-4 py-3 text-center text-lg tracking-[0.5em] font-mono",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              errors.code ? "border-danger" : "border-input"
            )}
            {...register("code")}
          />
          {errors.code && <p className="text-sm text-danger">{errors.code.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white",
            "transition-colors hover:bg-primary-active",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </span>
          ) : (
            "Verify"
          )}
        </button>
      </form>

      <div className="flex flex-col gap-2 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-sm text-primary hover:text-primary-active disabled:opacity-50"
        >
          {isResending ? "Sending..." : "Resend code"}
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>
      </div>
    </div>
  );
};

export default LoginWith2FA;
