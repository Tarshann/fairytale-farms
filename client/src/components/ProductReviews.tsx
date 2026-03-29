import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

import { Loader2, Star, MessageSquare, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ProductReviewsProps {
  productId: number;
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
          aria-label={`${i} star${i !== 1 ? "s" : ""}`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              i <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-12 text-right text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-muted-foreground">{count}</span>
    </div>
  );
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: reviews, isLoading: reviewsLoading } = trpc.reviews.listByProduct.useQuery(
    { productId },
    { enabled: !!productId }
  );

  const { data: summary, isLoading: summaryLoading } = trpc.reviews.ratingSummary.useQuery(
    { productId },
    { enabled: !!productId }
  );

  const { data: myReview } = trpc.reviews.myReview.useQuery(
    { productId },
    { enabled: isAuthenticated && !!productId }
  );

  const submitReview = trpc.reviews.submit.useMutation({
    onSuccess: () => {
      toast.success(`Review submitted! — ` + "Your review is pending approval and will appear shortly.");;
      setSubmitted(true);
      utils.reviews.listByProduct.invalidate({ productId });
      utils.reviews.ratingSummary.invalidate({ productId });
    },
    onError: err => {
      toast.error(err.message);;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");;
      return;
    }
    submitReview.mutate({ productId, rating, title: title || undefined, comment: comment || undefined });
  };

  const isLoading = reviewsLoading || summaryLoading;

  return (
    <div className="space-y-8">
      {/* Summary */}
      {!isLoading && summary && summary.totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="text-center sm:w-32 shrink-0">
            <p className="text-5xl font-bold text-amber-500">{summary.averageRating}</p>
            <div className="flex justify-center mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i <= Math.round(summary.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => (
              <RatingBar
                key={star}
                label={`${star} ★`}
                count={summary.distribution[star] ?? 0}
                total={summary.totalReviews}
              />
            ))}
          </div>
        </div>
      )}

      {/* Write a Review */}
      {isAuthenticated ? (
        myReview || submitted ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>
              {submitted
                ? "Your review has been submitted and is pending approval."
                : "You've already reviewed this product. Thank you!"}
            </span>
          </div>
        ) : (
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Write a Review
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Your Rating *</Label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div>
                  <Label htmlFor="review-title" className="text-sm mb-1 block">
                    Title (optional)
                  </Label>
                  <Input
                    id="review-title"
                    placeholder="Summarize your experience..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="review-comment" className="text-sm mb-1 block">
                    Review (optional)
                  </Label>
                  <Textarea
                    id="review-comment"
                    placeholder="Tell others about your experience with this product..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    maxLength={2000}
                  />
                </div>
                <Button type="submit" disabled={submitReview.isPending || rating === 0}>
                  {submitReview.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="text-center py-6 border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <a href="/login" className="text-primary underline underline-offset-2">
              Sign in
            </a>{" "}
            to leave a review.
          </p>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (reviews ?? []).length === 0 ? (
        <div className="text-center py-8">
          <Star className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(reviews ?? []).map(review => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {review.userName || "Verified Customer"} ·{" "}
                  {new Date(review.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {review.title && (
                <p className="text-sm font-semibold mb-0.5">{review.title}</p>
              )}
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
