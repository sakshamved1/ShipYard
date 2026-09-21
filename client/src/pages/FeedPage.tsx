import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  ThumbsUp,
  Sparkles,
  Plus,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CreatePostDialog } from "@/features/posts";

export interface PostItem {
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

const CATEGORIES = ["All", "UI/UX", "Integrations", "Performance", "General"] as const;
const SORTS = [
  { id: "top", label: "Top Voted" },
  { id: "trending", label: "Trending" },
  { id: "new", label: "Newest" },
  { id: "oldest", label: "Oldest" },
] as const;

export const FeedPage: React.FC = () => {
  usePageMeta(
    "Feature Requests",
    "Browse, vote, and submit feature requests for ShipYard. Shape the product roadmap directly."
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [createPostOpen, setCreatePostOpen] = React.useState(false);

  const selectedCategory = searchParams.get("category") || "All";
  const selectedSort = searchParams.get("sort") || "top";
  const searchQuery = searchParams.get("q") || "";

  // Query posts with query parameters
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["posts", { category: selectedCategory, sort: selectedSort, q: searchQuery }],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        sort: selectedSort,
        limit: 20,
      };
      if (selectedCategory !== "All") {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      const res = await api.get<PostItem[]>("/posts", { params });
      return res.data;
    },
  });

  // Vote mutation with optimistic updates
  const voteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.post<{ hasVoted: boolean; voteCount: number }>(`/posts/${postId}/vote`);
      return { postId, ...res.data };
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousData = queryClient.getQueryData<PostItem[]>([
        "posts",
        { category: selectedCategory, sort: selectedSort, q: searchQuery },
      ]);

      if (previousData) {
        queryClient.setQueryData<PostItem[]>(
          ["posts", { category: selectedCategory, sort: selectedSort, q: searchQuery }],
          previousData.map((p) => {
            if (p._id === postId) {
              const newVoted = !p.hasVoted;
              return {
                ...p,
                hasVoted: newVoted,
                voteCount: newVoted ? p.voteCount + 1 : Math.max(0, p.voteCount - 1),
              };
            }
            return p;
          })
        );
      }

      return { previousData };
    },
    onSuccess: (result) => {
      toast.success(
        result.hasVoted ? "Vote recorded" : "Vote removed",
        result.hasVoted ? "Thanks for your feedback!" : "Your upvote was removed."
      );
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
    },
    onError: (err: ApiError, _postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["posts", { category: selectedCategory, sort: selectedSort, q: searchQuery }],
          context.previousData
        );
      }
      toast.error("Failed to vote", err.message || "Please log in to vote.");
    },
  });

  const handleVote = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Authentication required", "Please log in to upvote feature requests.");
      return;
    }
    voteMutation.mutate(postId);
  };

  const getStatusBadge = (status: PostItem["status"]) => {
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

  const posts = data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Feature Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Give feedback, vote on open suggestions, and help shape the future of ShipYard.
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

      {/* Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 p-3 rounded-2xl border border-border/70">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Category filters">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (cat === "All") next.delete("category");
                  else next.set("category", cat);
                  setSearchParams(next);
                }}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={selectedSort}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              next.set("sort", e.target.value);
              setSearchParams(next);
            }}
            aria-label="Sort requests"
            className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Search Filter Badge */}
      {searchQuery && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg w-fit">
          <span>Search: <strong className="text-foreground">"{searchQuery}"</strong></span>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("q");
              setSearchParams(next);
            }}
            className="text-primary hover:underline font-medium cursor-pointer ml-1"
          >
            Clear
          </button>
        </div>
      )}

      {/* STATE 1: LOADING SKELETON */}
      {isLoading && (
        <div className="grid gap-4" aria-busy="true" aria-label="Loading feature requests">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-5 w-20 rounded" />
                  </div>
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
                <Skeleton className="h-16 w-14 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* STATE 2: ERROR WITH RETRY */}
      {isError && !isLoading && (
        <ErrorState
          title="Could not load feature requests"
          message={error instanceof Error ? error.message : "An unexpected network error occurred."}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* STATE 3: EMPTY */}
      {!isLoading && !isError && posts.length === 0 && (
        <Empty
          icon={<Sparkles className="h-7 w-7 text-primary" />}
          title={searchQuery || selectedCategory !== "All" ? "No matching requests found" : "No requests yet"}
          description={
            searchQuery || selectedCategory !== "All"
              ? "Try adjusting your filters or search keywords to find what you're looking for."
              : "Be the first to suggest a new feature or idea to get the conversation started!"
          }
          action={
            searchQuery || selectedCategory !== "All" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchParams(new URLSearchParams())}
                className="min-h-[40px]"
              >
                Reset all filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreatePostOpen(true)}
                className="min-h-[40px] gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Submit first request</span>
              </Button>
            )
          }
        />
      )}

      {/* STATE 4: SUCCESS LIST */}
      {!isLoading && !isError && posts.length > 0 && (
        <div className="grid gap-4">
          {posts.map((post) => {
            const isPendingVote = voteMutation.isPending && voteMutation.variables === post._id;
            return (
              <Link
                key={post._id}
                to={`/posts/${post._id}`}
                className="block group"
              >
                <Card className="p-5 sm:p-6 transition-all hover:border-primary/50 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">{post.category}</Badge>
                        {getStatusBadge(post.status)}
                      </div>

                      <CardTitle className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {post.title}
                      </CardTitle>

                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          {post.author?.name || "Anonymous"}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{post.commentCount} comments</span>
                        </span>
                        <span>&bull;</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Right: Upvote Button */}
                    <button
                      type="button"
                      onClick={(e) => handleVote(post._id, e)}
                      disabled={isPendingVote}
                      aria-label={`${post.hasVoted ? "Remove upvote from" : "Upvote"} ${post.title}. Current votes: ${post.voteCount}`}
                      className={`flex flex-col items-center justify-center min-h-[56px] min-w-[52px] rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        post.hasVoted
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/30 border-border/80 hover:border-primary/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ThumbsUp
                        className={`h-4 w-4 transition-transform ${post.hasVoted ? "scale-110" : ""}`}
                      />
                      <span className="text-xs font-bold mt-1 leading-none">
                        {post.voteCount}
                      </span>
                    </button>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <CreatePostDialog open={createPostOpen} onOpenChange={setCreatePostOpen} />
    </div>
  );
};
