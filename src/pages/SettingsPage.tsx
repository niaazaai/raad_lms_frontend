import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import { callApi, fetchCsrfCookie } from "@/services";
import { API_ENDPOINTS } from "@/data/constants/endpoints";
import { RequestMethod } from "@/data/constants/methods";
import { toast } from "sonner";
import * as z from "zod";

const TwoFactorEnableSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});

const TwoFactorDisableSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type TwoFactorEnableData = z.infer<typeof TwoFactorEnableSchema>;
type TwoFactorDisableData = z.infer<typeof TwoFactorDisableSchema>;

const SettingsPage = () => {
  const { user, fetchUser } = useAuth();
  const [enableStep, setEnableStep] = useState<"idle" | "code">("idle");
  const [showDisable, setShowDisable] = useState(false);

  const enableForm = useForm<TwoFactorEnableData>({
    resolver: zodResolver(TwoFactorEnableSchema),
    defaultValues: { code: "" },
  });

  const disableForm = useForm<TwoFactorDisableData>({
    resolver: zodResolver(TwoFactorDisableSchema),
    defaultValues: { password: "" },
  });

  const handleRequestEnable = async () => {
    try {
      await fetchCsrfCookie();
      const response = await callApi({
        url: API_ENDPOINTS.AUTH.ENABLE_2FA,
        method: RequestMethod.POST,
      });
      if (response.ok) {
        setEnableStep("code");
        toast.success("Verification code sent to your email");
      }
    } catch {
      toast.error("Failed to send code");
    }
  };

  const handleConfirmEnable = async (data: TwoFactorEnableData) => {
    try {
      await fetchCsrfCookie();
      const response = await callApi({
        url: "/auth/2fa/confirm",
        method: RequestMethod.POST,
        data: { code: data.code },
      });
      if (response.ok) {
        toast.success("Two-factor authentication enabled");
        setEnableStep("idle");
        enableForm.reset();
        await fetchUser();
      } else {
        const body = response.data as { message?: string };
        toast.error(body?.message ?? "Invalid code");
      }
    } catch {
      toast.error("Failed to enable 2FA");
    }
  };

  const handleDisable = async (data: TwoFactorDisableData) => {
    try {
      await fetchCsrfCookie();
      const response = await callApi({
        url: API_ENDPOINTS.AUTH.DISABLE_2FA,
        method: RequestMethod.POST,
        data: { password: data.password },
      });
      if (response.ok) {
        toast.success("Two-factor authentication disabled");
        setShowDisable(false);
        disableForm.reset();
        await fetchUser();
      } else {
        const body = response.data as { message?: string };
        toast.error(body?.message ?? "Invalid password");
      }
    } catch {
      toast.error("Failed to disable 2FA");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
        </div>

        <div className="mt-6">
          {user?.two_factor_enabled ? (
            <div>
              <p className="text-sm text-success font-medium">2FA is enabled</p>
              {!showDisable ? (
                <button
                  type="button"
                  onClick={() => setShowDisable(true)}
                  className="mt-2 text-sm text-danger hover:underline"
                >
                  Disable two-factor authentication
                </button>
              ) : (
                <form
                  onSubmit={disableForm.handleSubmit(handleDisable)}
                  className="mt-4 space-y-4 max-w-sm"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Enter your password to disable 2FA
                    </label>
                    <input
                      type="password"
                      {...disableForm.register("password")}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                      placeholder="Your password"
                    />
                    {disableForm.formState.errors.password && (
                      <p className="text-sm text-danger mt-1">
                        {disableForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={disableForm.formState.isSubmitting}
                      className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90"
                    >
                      {disableForm.formState.isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Disable 2FA"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisable(false);
                        disableForm.reset();
                      }}
                      className="rounded-lg border border-input px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : enableStep === "code" ? (
            <form onSubmit={enableForm.handleSubmit(handleConfirmEnable)} className="mt-4 space-y-4 max-w-sm">
              <div>
                <label className="block text-sm font-medium mb-1">Enter the 6-digit code from your email</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  {...enableForm.register("code")}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm font-mono tracking-widest"
                  placeholder="000000"
                />
                {enableForm.formState.errors.code && (
                  <p className="text-sm text-danger mt-1">{enableForm.formState.errors.code.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={enableForm.formState.isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active"
                >
                  {enableForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEnableStep("idle")}
                  className="rounded-lg border border-input px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={handleRequestEnable}
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active"
            >
              Enable two-factor authentication
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
