import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layers, UserPlus, Lock, Mail, User, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import { usePageMeta } from "@/hooks/usePageMeta";

export const SignupPage: React.FC = () => {
  usePageMeta("Create Account", "Join ShipYard to post ideas, upvote feature requests, and join discussions.");

  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; password?: string }>({});

  const nameInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      nameInputRef.current?.focus();
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) {
      errs.name = "Full name is required.";
    }

    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signup(name.trim(), email.trim(), password);
      navigate("/");
    } catch {
      // Error handled by toast in AuthContext
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
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription className="text-xs">
            Join ShipYard to post ideas, upvote feature requests, and join discussions.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-name"
                className="text-xs font-medium flex items-center gap-1.5 text-foreground"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Full name</span>
              </label>
              <Input
                id="signup-name"
                ref={nameInputRef}
                type="text"
                placeholder="Alex Rivers"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                disabled={isSubmitting}
                aria-invalid={!!errors.name}
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="text-xs font-medium flex items-center gap-1.5 text-foreground"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Email address</span>
              </label>
              <Input
                id="signup-email"
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
              <label
                htmlFor="signup-password"
                className="text-xs font-medium flex items-center gap-1.5 text-foreground"
              >
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Password</span>
              </label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Min. 8 characters"
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline min-h-[32px] inline-flex items-center">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
