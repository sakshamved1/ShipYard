import * as React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";

export const NotFoundPage: React.FC = () => {
  usePageMeta("Page Not Found", "The requested page does not exist on ShipYard.");

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 space-y-4 animate-in fade-in-50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-2">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">404 - Page Not Found</h1>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
        The feature request, discussion, or page you are looking for does not exist or has been moved.
      </p>
      <div className="pt-2">
        <Link to="/">
          <Button variant="primary" className="gap-2 min-h-[40px]">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Feature Requests</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
