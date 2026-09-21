import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ThumbsUp, Calendar, User as UserIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { MarkdownViewer } from "@/components/shared/MarkdownViewer";
import { CommentsSection } from "@/features/comments";

export interface PostDetailData {
  _id: string;
  title: string;
  description: string;
  category: "UI/UX" | "Integrations" | "Performance" | "General";
  status: "under_review" | "planned" | "in_progress" | "completed";
  author: {
    _id: string;
    name: string;
  };
  voteCount: number;
  commentCount: number;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const {
    data: post,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing post ID");
      const res = await api.get<PostDetailData>(`/posts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  usePageMeta(
    post ? post.title : "Feature Request Detail",
    post ? post.description.slice(0, 150) : "View details and join the discussion."
  );

  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const res = await api.post<{ hasVoted: boolean; voteCount: number }>(`/posts/${id}/vote`);
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post", id] });
      const prev = queryClient.getQueryData<PostDetailData>(["post", id]);
      if (prev) {
        const nextVoted = !prev.hasVoted;
        queryClient.setQueryData<PostDetailData>(["post", id], {
          ...prev,
          hasVoted: nextVoted,
          voteCount: nextVoted ? prev.voteCount + 1 : Math.max(0, prev.voteCount - 1),
        });
      }
      return { prev };
    },
    onSuccess: (result) => {
      if (result) {
        toast.success(
          result.hasVoted ? "Vote recorded" : "Vote removed",
          result.hasVoted ? "Thanks for your feedback!" : "Your vote was withdrawn."
        );
      }
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
    },
    onError: (err: ApiError, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["post", id], context.prev);
      }
      toast.error("Failed to vote", err.message || "Please log in to vote.");
    },
  });

  const handleVote = () => {
    if (!isAuthenticated) {
      toast.info("Authentication required", "Please log in to upvote feature requests.");
      return;
    }
    voteMutation.mutate();
  };

  const getStatusBadge = (status: PostDetailData["status"]) => {
    switch (status) {
      case "planned":
        return <Badge variant="warning">Planned</Badge>;
      case "in_progress":
        return <Badge variant="info">In Progress</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="outline">Under Review</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Feature Requests</span>
      </Link>

      {/* STATE 1: LOADING SKELETON */}
      {isLoading && (
        <Card className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <Skeleton className="h-8 w-3/4 rounded" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-16 w-14 rounded-xl" />
          </div>
          <div className="space-y-2 pt-4 border-t border-border/60">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </Card>
      )}

      {/* STATE 2: ERROR WITH RETRY */}
      {isError && !isLoading && (
        <ErrorState
          title="Could not load request"
          message={error instanceof Error ? error.message : "The requested post could not be retrieved."}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* STATE 3: EMPTY / NOT FOUND */}
      {!isLoading && !isError && !post && (
        <Empty
          icon={<AlertTriangle className="h-7 w-7 text-amber-500" />}
          title="Feature request not found"
          description="This post may have been removed or the link is invalid."
          action={
            <Link to="/">
              <Button variant="primary" size="sm">
                Return to feed
              </Button>
            </Link>
          }
        />
      )}

      {/* STATE 4: SUCCESS DETAIL VIEW */}
      {!isLoading && !isError && post && (
        <>
          <Card>
            <CardHeader className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{post.category}</Badge>
                    {getStatusBadge(post.status)}
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                    {post.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground/90">
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {post.author?.name || "Anonymous"}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Vote Button */}
                <button
                  type="button"
                  onClick={handleVote}
                  disabled={voteMutation.isPending}
                  aria-label={`${post.hasVoted ? "Remove upvote from" : "Upvote"} ${post.title}. Current votes: ${post.voteCount}`}
                  className={`flex flex-col items-center justify-center min-h-[64px] min-w-[56px] rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    post.hasVoted
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/30 border-border/80 hover:border-primary/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ThumbsUp className={`h-5 w-5 transition-transform ${post.hasVoted ? "scale-110" : ""}`} />
                  <span className="text-sm font-bold mt-1 leading-none">
                    {post.voteCount}
                  </span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 border-t border-border/60">
              <div className="pt-4">
                <MarkdownViewer content={post.description} />
              </div>
            </CardContent>
          </Card>

          {/* Threaded Discussion Section */}
          <CommentsSection postId={post._id} />
        </>
      )}
    </div>
  );
};
