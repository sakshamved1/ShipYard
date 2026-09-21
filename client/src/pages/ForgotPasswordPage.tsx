import * as React from "react";
import { Link } from "react-router-dom";
import { Layers, ArrowLeft, Mail, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

export const ForgotPasswordPage: React.FC = () => {
  usePageMeta("Forgot Password", "Request password reset instructions for your ShipYard account.");

  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [isSent, setIsSent] = React.useState(false);

  const emailRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);
    try {
      await api.post("/auth/request-password-reset", { email: email.trim() });
      setIsSent(true);
      toast.success(
        "Reset link sent",
        "If an account exists with that email, reset instructions have been dispatched."
      );
    } catch {
      // Even on error, show generic success to prevent enumeration
      setIsSent(true);
      toast.success(
        "Reset link sent",
        "If an account exists with that email, reset instructions have been dispatched."
      );
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
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription className="text-xs">
            Enter your account email to receive a secure password reset link.
          </CardDescription>
        </CardHeader>

        {isSent ? (
          <CardContent className="space-y-4 text-center py-4">
            <div className="p-4 rounded-xl bg-primary/10 text-primary text-xs leading-relaxed">
              If an account with <strong className="text-foreground">{email}</strong> exists, an email with reset instructions has been sent. Please check your inbox.
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full min-h-[40px]">
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-email"
                  className="text-xs font-medium flex items-center gap-1.5 text-foreground"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Email address</span>
                </label>
                <Input
                  id="reset-email"
                  ref={emailRef}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(undefined);
                  }}
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                  className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{error}</span>
                  </p>
                )}
              </div>
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
                    <span>Sending instructions...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Reset Link</span>
                  </>
                )}
              </Button>
              <Link
                to="/login"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 min-h-[32px]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to log in</span>
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};
