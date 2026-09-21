import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";

export type Category = "UI/UX" | "Integrations" | "Performance" | "General";

const CATEGORIES: Category[] = ["UI/UX", "Integrations", "Performance", "General"];

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<Category>("UI/UX");
  const [errors, setErrors] = React.useState<{ title?: string; description?: string }>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const isDirty = title.trim().length > 0 || description.trim().length > 0;

  // Reset form when opened or closed
  React.useEffect(() => {
    if (open) {
      setShowDiscardConfirm(false);
      // Autofocus first field
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    } else {
      setTitle("");
      setDescription("");
      setCategory("UI/UX");
      setErrors({});
      setShowDiscardConfirm(false);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (payload: { title: string; description: string; category: Category }) => {
      const res = await api.post<{ _id: string; title: string }>("/posts", payload);
      return res.data;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Feature request submitted", `"${post.title}" is now under review.`);
      onOpenChange(false);
    },
    onError: (err: ApiError) => {
      toast.error("Failed to submit request", err.message || "An unexpected error occurred.");
    },
  });

  const validate = () => {
    const errs: { title?: string; description?: string } = {};
    if (title.trim().length < 5) {
      errs.title = "Title must be at least 5 characters.";
    } else if (title.trim().length > 120) {
      errs.title = "Title cannot exceed 120 characters.";
    }

    if (description.trim().length < 10) {
      errs.description = "Description must be at least 10 characters.";
    } else if (description.trim().length > 5000) {
      errs.description = "Description cannot exceed 5000 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Authentication required", "Please log in to submit a feature request.");
      onOpenChange(false);
      navigate("/login");
      return;
    }

    if (!validate()) return;

    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
    });
  };

  // Safe close handler with unsaved-draft protection
  const handleRequestClose = () => {
    if (mutation.isPending) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    onOpenChange(false);
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleRequestClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="sm:max-w-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <DialogTitle>Submit a Feature Request</DialogTitle>
          </div>
          <DialogDescription>
            Share an idea or improvement. The community can upvote and discuss it.
          </DialogDescription>

          {showDiscardConfirm ? (
            <div className="my-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm animate-in fade-in-50">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Discard unsaved draft?</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                You have unsaved changes in this feature request. If you leave now, your input will be lost.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Keep editing
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={confirmDiscard}
                >
                  Discard draft
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Title Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="post-title"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Title</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {title.length}/120
                  </span>
                </label>
                <Input
                  id="post-title"
                  ref={titleInputRef}
                  placeholder="e.g. Add dark mode automatic system sync"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  disabled={mutation.isPending}
                  aria-invalid={!!errors.title}
                  className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        disabled={mutation.isPending}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/40 text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description (Markdown supported) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="post-description"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Description (Markdown supported)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {description.length}/5000
                  </span>
                </label>
                <textarea
                  id="post-description"
                  rows={4}
                  placeholder="Describe the problem, the proposed solution, and why it matters..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                  disabled={mutation.isPending}
                  aria-invalid={!!errors.description}
                  className={`w-full rounded-xl border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 transition-colors resize-y min-h-[100px] ${
                    errors.description ? "border-destructive focus-visible:ring-destructive" : "border-border"
                  }`}
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Tip: Press Ctrl+Enter to submit</span>
                  {errors.description && (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRequestClose}
                  disabled={mutation.isPending}
                  className="min-h-[40px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={mutation.isPending}
                  className="min-h-[40px] gap-2 font-medium"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
