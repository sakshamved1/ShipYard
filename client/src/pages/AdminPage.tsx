import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Kanban,
  ThumbsUp,
  Clock,
  CheckCircle2,
  Filter,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";

export interface AdminStats {
  countsByStatus: Record<string, number>;
  totalPosts: number;
  totalVotes: number;
  postsLast7Days: number;
}

export interface AdminPost {
  _id: string;
  title: string;
  category: string;
  status: "under_review" | "planned" | "in_progress" | "completed";
  voteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS: Array<{ value: AdminPost["status"]; label: string }> = [
  { value: "under_review", label: "Under Review" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export const AdminPage: React.FC = () => {
  usePageMeta("Admin Portal", "Manage feature requests, status transitions, and community stats.");

  const { isAuthenticated, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Query 1: Admin Stats
  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
    isFetching: isStatsFetching,
  } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await api.get<AdminStats>("/admin/stats");
      return res.data;
    },
    enabled: isAuthenticated && isAdmin,
  });

  // Query 2: Admin Posts Table
  const {
    data: postsData,
    isLoading: isPostsLoading,
    isError: isPostsError,
    error: postsError,
    refetch: refetchPosts,
    isFetching: isPostsFetching,
  } = useQuery({
    queryKey: ["admin", "posts", { status: statusFilter, q: searchQuery }],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        limit: 50,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      const res = await api.get<AdminPost[]>("/admin/posts", { params });
      return res.data;
    },
    enabled: isAuthenticated && isAdmin,
  });

  // Mutation: Patch post status
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdminPost["status"] }) => {
      const res = await api.patch<AdminPost>(`/admin/posts/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (updated) => {
      toast.success(
        "Status updated",
        `Post "${updated.title}" moved to ${updated.status.replace("_", " ")}.`
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: ApiError) => {
      toast.error("Failed to update status", err.message || "Unauthorized action.");
    },
  });

  const getStatusBadge = (status: AdminPost["status"]) => {
    switch (status) {
      case "planned":
        return <Badge variant="warning" size="sm">Planned</Badge>;
      case "in_progress":
        return <Badge variant="info" size="sm">In Progress</Badge>;
      case "completed":
        return <Badge variant="success" size="sm">Completed</Badge>;
      default:
        return <Badge variant="outline" size="sm">Under Review</Badge>;
    }
  };

  // Auth Guard
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4 animate-in fade-in-50">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Access Required</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You need an administrator account to view portal metrics and transition post statuses.
        </p>
        <div className="pt-2">
          <Link to="/login">
            <Button variant="primary" size="sm" className="min-h-[40px] px-4">
              Sign In as Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const posts = postsData ?? [];

  return (
    <div className="space-y-8 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Admin Portal
            </h1>
            <Badge variant="warning" size="sm">
              Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product initiatives, transition statuses, and view live feedback metrics.
          </p>
        </div>
      </div>

      {/* SECTION 1: STATS (All 4 states) */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Overview &amp; Metrics
        </h2>

        {/* Stats State 1: Loading Skeleton */}
        {isStatsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-7 w-16 rounded" />
              </Card>
            ))}
          </div>
        )}

        {/* Stats State 2: Error */}
        {isStatsError && !isStatsLoading && (
          <ErrorState
            title="Failed to load statistics"
            message={statsError instanceof Error ? statsError.message : "Error loading metrics."}
            onRetry={() => refetchStats()}
            isRetrying={isStatsFetching}
          />
        )}

        {/* Stats State 3 & 4: Success Stats */}
        {!isStatsLoading && !isStatsError && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Kanban className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Requests</div>
                <div className="text-2xl font-bold text-foreground">{stats.totalPosts}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ThumbsUp className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Votes Cast</div>
                <div className="text-2xl font-bold text-foreground">{stats.totalVotes}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">New (Last 7 Days)</div>
                <div className="text-2xl font-bold text-foreground">{stats.postsLast7Days}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Shipped / Completed</div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.countsByStatus?.completed || 0}
                </div>
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* SECTION 2: ADMIN POSTS MANAGEMENT TABLE (All 4 states) */}
      <section aria-labelledby="posts-table-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 id="posts-table-heading" className="text-base font-bold text-foreground">
            Manage Feature Requests
          </h2>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="search"
                placeholder="Filter requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-background border border-border rounded-lg min-h-[36px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter posts by status"
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 min-h-[36px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="under_review">Under Review</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Table State 1: Loading Skeleton */}
        {isPostsLoading && (
          <Card className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40">
                <Skeleton className="h-5 w-1/3 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-8 w-32 rounded-lg" />
              </div>
            ))}
          </Card>
        )}

        {/* Table State 2: Error */}
        {isPostsError && !isPostsLoading && (
          <ErrorState
            title="Failed to load posts table"
            message={postsError instanceof Error ? postsError.message : "Error retrieving admin table data."}
            onRetry={() => refetchPosts()}
            isRetrying={isPostsFetching}
          />
        )}

        {/* Table State 3: Empty */}
        {!isPostsLoading && !isPostsError && posts.length === 0 && (
          <Empty
            icon={<Filter className="h-6 w-6 text-muted-foreground" />}
            title="No feature requests found"
            description="There are no requests matching the current status filter."
            action={
              statusFilter !== "all" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatusFilter("all")}
                >
                  Clear filter
                </Button>
              ) : undefined
            }
          />
        )}

        {/* Table State 4: Success Table */}
        {!isPostsLoading && !isPostsError && posts.length > 0 && (
          <Card className="overflow-hidden border-border/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Title &amp; Category</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-center">Votes</th>
                    <th className="py-3 px-4 text-center">Comments</th>
                    <th className="py-3 px-4 text-right">Transition Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {posts.map((post) => {
                    const isPendingThis =
                      statusMutation.isPending && statusMutation.variables?.id === post._id;

                    return (
                      <tr key={post._id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 max-w-xs sm:max-w-md">
                          <Link
                            to={`/posts/${post._id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
                          >
                            {post.title}
                          </Link>
                          <span className="text-[10px] text-muted-foreground">{post.category}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(post.status)}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-foreground">
                          {post.voteCount}
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground">
                          {post.commentCount}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <select
                            value={post.status}
                            disabled={isPendingThis}
                            onChange={(e) => {
                              const newStatus = e.target.value as AdminPost["status"];
                              if (newStatus !== post.status) {
                                statusMutation.mutate({ id: post._id, status: newStatus });
                              }
                            }}
                            aria-label={`Change status for ${post.title}`}
                            className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 min-h-[36px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
};
