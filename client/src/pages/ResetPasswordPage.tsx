import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layers, Lock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

export const ResetPasswordPage: React.FC = () => {
  usePageMeta("Reset Password", "Set a new password for your ShipYard account.");

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      toast.success("Password updated", "Your password has been reset. Please sign in.");
      navigate("/login");
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Failed to reset password. The link may have expired.";
      setError(msg);
      toast.error("Password reset failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 animate-in fade-in-50">
      <Card className="shadow-lg border-border/80">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <Layers className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Create new password</CardTitle>
          <CardDescription className="text-xs">
            Enter a strong new password to regain access to your account.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-xs font-medium flex items-center gap-1.5 text-foreground"
              >
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>New password</span>
              </label>
              <Input
                id="new-password"
                ref={passwordRef}
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(undefined);
                }}
                disabled={isSubmitting}
                aria-invalid={!!error}
                className={error ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-xs font-medium flex items-center gap-1.5 text-foreground"
              >
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Confirm password</span>
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(undefined);
                }}
                disabled={isSubmitting}
                aria-invalid={!!error}
                className={error ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center gap-2 min-h-[40px] font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save New Password</span>
                </>
              )}
            </Button>
            <Link
              to="/login"
              className="text-xs text-muted-foreground hover:text-foreground text-center min-h-[32px] inline-flex items-center justify-center"
            >
              Back to Sign In
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
