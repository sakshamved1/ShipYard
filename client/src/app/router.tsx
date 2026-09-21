import * as React from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/shared/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

// Code-split routes with dynamic import()
const FeedPage = React.lazy(() =>
  import("@/pages/FeedPage").then((m) => ({ default: m.FeedPage }))
);
const RoadmapPage = React.lazy(() =>
  import("@/pages/RoadmapPage").then((m) => ({ default: m.RoadmapPage }))
);
const PostDetailPage = React.lazy(() =>
  import("@/pages/PostDetailPage").then((m) => ({ default: m.PostDetailPage }))
);
const LoginPage = React.lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const SignupPage = React.lazy(() =>
  import("@/pages/SignupPage").then((m) => ({ default: m.SignupPage }))
);
const VerifyEmailPage = React.lazy(() =>
  import("@/pages/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage }))
);
const ForgotPasswordPage = React.lazy(() =>
  import("@/pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = React.lazy(() =>
  import("@/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const AdminPage = React.lazy(() =>
  import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage }))
);
const NotFoundPage = React.lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

const PageFallback: React.FC = () => (
  <div className="space-y-6 animate-in fade-in-50 py-4" aria-busy="true" aria-label="Loading page">
    <div className="flex items-center justify-between pb-4 border-b border-border/60">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>
      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  </div>
);

function withSuspense(Component: React.ComponentType) {
  return (
    <React.Suspense fallback={<PageFallback />}>
      <Component />
    </React.Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: withSuspense(FeedPage),
      },
      {
        path: "roadmap",
        element: withSuspense(RoadmapPage),
      },
      {
        path: "posts/:id",
        element: withSuspense(PostDetailPage),
      },
      {
        path: "login",
        element: withSuspense(LoginPage),
      },
      {
        path: "signup",
        element: withSuspense(SignupPage),
      },
      {
        path: "verify-email",
        element: withSuspense(VerifyEmailPage),
      },
      {
        path: "forgot-password",
        element: withSuspense(ForgotPasswordPage),
      },
      {
        path: "reset-password",
        element: withSuspense(ResetPasswordPage),
      },
      {
        path: "admin",
        element: withSuspense(AdminPage),
      },
      {
        path: "*",
        element: withSuspense(NotFoundPage),
      },
    ],
  },
]);
