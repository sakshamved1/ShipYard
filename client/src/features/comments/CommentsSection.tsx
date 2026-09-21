import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  CornerDownRight,
  Trash2,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth";
import { MarkdownViewer } from "@/components/shared/MarkdownViewer";

export interface CommentItem {
  _id: string;
  post: string;
  author: {
    _id: string;
    name: string;
  };
  body: string;
  parent: string | null;
  root: string | null;
  depth: number;
  isDeleted: boolean;
  editedAt?: string;
  createdAt: string;
  children?: CommentItem[];
}

interface CommentsSectionProps {
  postId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ postId }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [newCommentBody, setNewCommentBody] = React.useState("");
  const [newCommentError, setNewCommentError] = React.useState<string | undefined>();
  const [replyingToId, setReplyingToId] = React.useState<string | null>(null);
  const [replyBody, setReplyBody] = React.useState("");
  const [replyError, setReplyError] = React.useState<string | undefined>();

  // Fetch comments
  const {
    data: commentsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await api.get<{ comments?: CommentItem[] } | CommentItem[]>(`/posts/${postId}/comments`);
      const data = res.data;
      const raw = Array.isArray(data) ? data : (data && "comments" in data && Array.isArray(data.comments) ? data.comments : []);
      return raw as CommentItem[];
    },
  });

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: async ({ body, parentId }: { body: string; parentId?: string }) => {
      const res = await api.post<CommentItem>(`/posts/${postId}/comments`, { body, parentId });
      return res.data;
    },
    onSuccess: () => {
      setNewCommentBody("");
      setNewCommentError(undefined);
      setReplyingToId(null);
      setReplyBody("");
      setReplyError(undefined);
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      toast.success("Comment posted", "Your comment has been added to the discussion.");
    },
    onError: (err: ApiError) => {
      toast.error("Failed to post comment", err.message || "An unexpected error occurred.");
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      toast.success("Comment deleted", "The comment was successfully removed.");
    },
    onError: (err: ApiError) => {
      toast.error("Failed to delete comment", err.message || "Action not authorized.");
    },
  });

  const handleCreateTopLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Sign in required", "Please log in to participate in discussions.");
      return;
    }
    if (newCommentBody.trim().length < 1) {
      setNewCommentError("Comment cannot be empty.");
      return;
    }
    createMutation.mutate({ body: newCommentBody.trim() });
  };

  const handleReplySubmit = (parentId: string) => {
    if (!isAuthenticated) {
      toast.info("Sign in required", "Please log in to reply.");
      return;
    }
    if (replyBody.trim().length < 1) {
      setReplyError("Reply cannot be empty.");
      return;
    }
    createMutation.mutate({ body: replyBody.trim(), parentId });
  };

  // Build tree from flat array
  const commentTree = React.useMemo(() => {
    if (!commentsData || !Array.isArray(commentsData)) return [];
    const map = new Map<string, CommentItem>();
    const roots: CommentItem[] = [];

    commentsData.forEach((c) => {
      map.set(c._id, { ...c, children: [] });
    });

    commentsData.forEach((c) => {
      const node = map.get(c._id)!;
      if (c.parent && map.has(c.parent)) {
        map.get(c.parent)!.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [commentsData]);

  const renderCommentNode = (comment: CommentItem) => {
    const isReplying = replyingToId === comment._id;
    const canDelete = isAuthenticated && (isAdmin || user?.id === comment.author?._id);

    return (
      <div
        key={comment._id}
        className={`space-y-3 ${comment.depth > 0 ? "pl-4 sm:pl-6 border-l-2 border-border/60 mt-3" : "mt-4"}`}
      >
        <Card className="p-4 bg-card/60">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">
                {comment.author?.name || "Anonymous"}
              </span>
              <span>&bull;</span>
              <span className="text-muted-foreground text-[11px]">
                {new Date(comment.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {comment.editedAt && (
                <span className="text-[10px] text-muted-foreground italic">(edited)</span>
              )}
            </div>

            {canDelete && !comment.isDeleted && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this comment?")) {
                    deleteMutation.mutate(comment._id);
                  }
                }}
                disabled={deleteMutation.isPending}
                aria-label="Delete comment"
                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="mt-2 text-xs sm:text-sm">
            {comment.isDeleted ? (
              <span className="italic text-muted-foreground text-xs">[This comment was deleted]</span>
            ) : (
              <MarkdownViewer content={comment.body} />
            )}
          </div>

          {/* Reply Button (if depth < 3 and not deleted) */}
          {!comment.isDeleted && comment.depth < 3 && (
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setReplyingToId(isReplying ? null : comment._id);
                  setReplyBody("");
                  setReplyError(undefined);
                }}
              >
                <CornerDownRight className="h-3.5 w-3.5" />
                <span>{isReplying ? "Cancel" : "Reply"}</span>
              </Button>
            </div>
          )}
        </Card>

        {/* Inline Reply Form */}
        {isReplying && (
          <div className="pl-4 sm:pl-6 pt-1 space-y-2 animate-in fade-in-50">
            <textarea
              rows={2}
              placeholder={`Replying to ${comment.author?.name || "author"}...`}
              value={replyBody}
              onChange={(e) => {
                setReplyBody(e.target.value);
                if (replyError) setReplyError(undefined);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  handleReplySubmit(comment._id);
                }
              }}
              disabled={createMutation.isPending}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
            {replyError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{replyError}</span>
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setReplyingToId(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="h-8 text-xs gap-1.5"
                disabled={createMutation.isPending}
                onClick={() => handleReplySubmit(comment._id)}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Post Reply</span>
              </Button>
            </div>
          </div>
        )}

        {/* Render child replies */}
        {comment.children && comment.children.length > 0 && (
          <div>{comment.children.map((child) => renderCommentNode(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-6 border-t border-border/80">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span>Threaded Discussion</span>
        </h2>
        <span className="text-xs text-muted-foreground">
          {commentsData?.length || 0} total comments
        </span>
      </div>

      {/* New Top-Level Comment Form */}
      <form onSubmit={handleCreateTopLevel} className="space-y-3 bg-card/40 p-4 rounded-2xl border border-border/70">
        <label htmlFor="new-comment" className="text-xs font-semibold text-foreground block">
          Leave a comment (Markdown supported)
        </label>
        <textarea
          id="new-comment"
          rows={3}
          placeholder="Share constructive feedback, implementation thoughts, or edge cases..."
          value={newCommentBody}
          onChange={(e) => {
            setNewCommentBody(e.target.value);
            if (newCommentError) setNewCommentError(undefined);
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              handleCreateTopLevel(e);
            }
          }}
          disabled={createMutation.isPending}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-y min-h-[80px]"
        />
        {newCommentError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>{newCommentError}</span>
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Tip: Ctrl+Enter to send</span>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={createMutation.isPending}
            className="gap-2 min-h-[40px] px-4 font-medium"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Comment</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* STATE 1: LOADING SKELETON */}
      {isLoading && (
        <div className="space-y-4" aria-label="Loading comments">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </Card>
          ))}
        </div>
      )}

      {/* STATE 2: ERROR WITH RETRY */}
      {isError && !isLoading && (
        <ErrorState
          title="Could not load comments"
          message={error instanceof Error ? error.message : "Failed to load comment thread."}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* STATE 3: EMPTY */}
      {!isLoading && !isError && commentTree.length === 0 && (
        <Empty
          icon={<MessageSquare className="h-6 w-6 text-muted-foreground" />}
          title="No comments yet"
          description="Start the discussion by sharing your feedback or insights above."
        />
      )}

      {/* STATE 4: SUCCESS THREAD */}
      {!isLoading && !isError && commentTree.length > 0 && (
        <div className="space-y-2">
          {commentTree.map((comment) => renderCommentNode(comment))}
        </div>
      )}
    </div>
  );
};
