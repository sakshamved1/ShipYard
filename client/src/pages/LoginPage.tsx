import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layers, LogIn, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import { usePageMeta } from "@/hooks/usePageMeta";

export const LoginPage: React.FC = () => {
  usePageMeta("Sign In", "Access your ShipYard account to submit feature requests and vote.");

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  const emailInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      emailInputRef.current?.focus();
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!password) {
      errs.password = "Password is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch {
      // Error handled by AuthContext toast
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
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-xs">
            Enter your email and password to access your ShipYard account.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-medium flex items-center gap-1.5 text-foreground"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Email address</span>
              </label>
              <Input
                id="login-email"
                ref={emailInputRef}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-medium flex items-center gap-1.5 text-foreground"
                >
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Password</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium min-h-[32px] inline-flex items-center"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.password}</span>
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
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline min-h-[32px] inline-flex items-center">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
