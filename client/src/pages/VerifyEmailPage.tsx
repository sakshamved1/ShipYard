import * as React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/usePageMeta";

export const VerifyEmailPage: React.FC = () => {
  usePageMeta("Verify Email", "Confirm and activate your ShipYard account.");

  return (
    <div className="max-w-md mx-auto py-12 animate-in fade-in-50">
      <Card className="shadow-lg border-border/80 text-center">
        <CardHeader className="space-y-3 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verified</CardTitle>
          <CardDescription className="text-xs">
            Your ShipYard account is active. You can now post suggestions, vote, and comment.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thank you for validating your credentials. You now have full access to participate in public discussions and track features.
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="primary" className="w-full gap-2 min-h-[40px]">
                <span>Go to Feature Requests</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
