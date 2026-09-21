import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kanban, Clock, CheckCircle2, ThumbsUp, MessageSquare, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CreatePostDialog } from "@/features/posts";

export interface RoadmapItem {
  id: string;
  title: string;
  category: "UI/UX" | "Integrations" | "Performance" | "General";
  voteCount: number;
  commentCount: number;
  hasVoted: boolean;
  updatedAt: string;
}

export interface RoadmapColumnData {
  items: RoadmapItem[];
  total: number;
}

export interface RoadmapResponse {
  planned: RoadmapColumnData;
  in_progress: RoadmapColumnData;
  completed: RoadmapColumnData;
}

const COLUMNS_CONFIG = [
  {
    key: "planned" as const,
    title: "Planned",
    description: "Prioritized for upcoming development sprints.",
    icon: Clock,
    badgeVariant: "warning" as const,
    headerBorder: "border-t-amber-500",
  },
  {
    key: "in_progress" as const,
    title: "In Progress",
    description: "Features actively being developed right now.",
    icon: Kanban,
    badgeVariant: "info" as const,
    headerBorder: "border-t-sky-500",
  },
  {
    key: "completed" as const,
    title: "Completed",
    description: "Shipped features live in production.",
    icon: CheckCircle2,
    badgeVariant: "success" as const,
    headerBorder: "border-t-emerald-500",
  },
];

export const RoadmapPage: React.FC = () => {
  usePageMeta(
    "Public Roadmap",
    "Track upcoming, active, and completed product initiatives live on our public Kanban roadmap."
  );

  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [createPostOpen, setCreatePostOpen] = React.useState(false);

  const {
    data: roadmap,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["roadmap"],
    queryFn: async () => {
      const res = await api.get<RoadmapResponse>("/roadmap");
      return res.data;
    },
  });

  // Vote mutation for roadmap cards
  const voteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.post<{ hasVoted: boolean; voteCount: number }>(`/posts/${postId}/vote`);
      return { postId, ...res.data };
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["roadmap"] });
      const prev = queryClient.getQueryData<RoadmapResponse>(["roadmap"]);
      if (prev) {
        const updateColumn = (col: RoadmapColumnData): RoadmapColumnData => ({
          ...col,
          items: col.items.map((it) => {
            if (it.id === postId) {
              const newVoted = !it.hasVoted;
              return {
                ...it,
                hasVoted: newVoted,
                voteCount: newVoted ? it.voteCount + 1 : Math.max(0, it.voteCount - 1),
              };
            }
            return it;
          }),
        });

        queryClient.setQueryData<RoadmapResponse>(["roadmap"], {
          planned: updateColumn(prev.planned),
          in_progress: updateColumn(prev.in_progress),
          completed: updateColumn(prev.completed),
        });
      }
      return { prev };
    },
    onSuccess: (result) => {
      toast.success(
        result.hasVoted ? "Vote recorded" : "Vote removed",
        result.hasVoted ? "Thanks for your feedback!" : "Your vote was removed."
      );
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: ApiError, _postId, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["roadmap"], context.prev);
      }
      toast.error("Failed to vote", err.message || "Please log in to vote.");
    },
  });

  const handleVote = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Authentication required", "Please log in to vote on roadmap items.");
      return;
    }
    voteMutation.mutate(postId);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Public Roadmap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore upcoming, active, and completed product initiatives live on our 3-column Kanban board.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="gap-2 min-h-[40px] px-4 self-start sm:self-auto"
          onClick={() => setCreatePostOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </Button>
      </div>

      {/* STATE 1: LOADING SKELETON */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Loading roadmap">
          {[1, 2, 3].map((colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col rounded-2xl border border-border/80 bg-card/40 p-4 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <div className="space-y-3">
                {[1, 2].map((cardIdx) => (
                  <Card key={cardIdx} className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                    <Skeleton className="h-5 w-full rounded" />
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STATE 2: ERROR WITH RETRY */}
      {isError && !isLoading && (
        <ErrorState
          title="Could not load roadmap"
          message={error instanceof Error ? error.message : "Failed to load public roadmap data."}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* STATE 3 & 4: SUCCESS 3-COLUMN KANBAN BOARD */}
      {!isLoading && !isError && roadmap && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS_CONFIG.map((colConfig) => {
            const Icon = colConfig.icon;
            const columnData = roadmap[colConfig.key] || { items: [], total: 0 };
            const items = columnData.items;

            return (
              <div
                key={colConfig.key}
                className={`flex flex-col rounded-2xl border border-border/80 bg-card/40 p-4 space-y-4 border-t-4 ${colConfig.headerBorder}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="font-semibold text-sm text-foreground">{colConfig.title}</h2>
                  </div>
                  <Badge variant={colConfig.badgeVariant} size="sm">
                    {columnData.total}
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground">{colConfig.description}</p>

                {/* Column Content */}
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
                    <p className="text-xs font-medium text-muted-foreground">
                      No items in {colConfig.title.toLowerCase()} yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                    {items.map((item) => {
                      const isPendingVote =
                        voteMutation.isPending && voteMutation.variables === item.id;
                      return (
                        <Link
                          key={item.id}
                          to={`/posts/${item.id}`}
                          className="block group"
                        >
                          <Card className="hover:border-primary/50 transition-all shadow-xs group-hover:shadow-sm">
                            <CardHeader className="p-4 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" size="sm" className="text-[10px]">
                                  {item.category}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={(e) => handleVote(item.id, e)}
                                  disabled={isPendingVote}
                                  aria-label={`${item.hasVoted ? "Remove vote from" : "Vote for"} ${item.title}`}
                                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer min-h-[32px] ${
                                    item.hasVoted
                                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                      : "bg-muted/40 border-border/70 hover:border-primary/60 text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  <span>{item.voteCount}</span>
                                </button>
                              </div>

                              <CardTitle className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                                {item.title}
                              </CardTitle>

                              {item.commentCount > 0 && (
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{item.commentCount}</span>
                                </div>
                              )}
                            </CardHeader>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Global Create Post Dialog */}
      <CreatePostDialog open={createPostOpen} onOpenChange={setCreatePostOpen} />
    </div>
  );
};
