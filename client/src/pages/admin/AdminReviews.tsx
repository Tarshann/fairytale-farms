import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

import {
  Loader2,
  ArrowLeft,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

type ReviewStatus = "pending" | "published" | "rejected";

const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  published: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("pending");

  const { data: reviews, isLoading } = trpc.reviews.all.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateStatus = trpc.reviews.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Review ${vars.status === "published" ? "approved" : "rejected"}.`);
      utils.reviews.all.invalidate();
      utils.reviews.pending.invalidate();
    },
    onError: err => {
      toast.error(err.message);
    },
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center">
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <Link href="/"><Button className="mt-4">Go Home</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const filtered = (reviews ?? []).filter(
    r => statusFilter === "all" || r.status === statusFilter
  );

  const stats = {
    pending: (reviews ?? []).filter(r => r.status === "pending").length,
    published: (reviews ?? []).filter(r => r.status === "published").length,
    flagged: (reviews ?? []).filter(r => r.aiFlagged).length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <Link href="/admin">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Review <span className="text-gradient-gold">Moderation</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            AI pre-screens reviews for spam and inappropriate content. Final approval is yours.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Awaiting Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
                <p className="text-sm text-muted-foreground">AI Flagged</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={v => setStatusFilter(v as ReviewStatus | "all")}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {statusFilter === "pending" ? "No reviews awaiting moderation." : "No reviews found."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(review => (
                <Card
                  key={review.id}
                  className={`overflow-hidden ${review.aiFlagged ? "border-red-200" : ""}`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <StarRating rating={review.rating} />
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[review.status as ReviewStatus]}`}
                          >
                            {review.status}
                          </span>
                          {review.aiFlagged && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              AI Flagged
                            </span>
                          )}
                          {review.aiSentimentScore && (
                            <span className="text-xs text-muted-foreground">
                              Sentiment: {(parseFloat(String(review.aiSentimentScore)) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold">{review.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            by {review.userName || review.userEmail} ·{" "}
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {review.title && (
                          <p className="text-sm font-medium">"{review.title}"</p>
                        )}
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {review.status === "pending" && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() =>
                              updateStatus.mutate({ id: review.id, status: "published" })
                            }
                            disabled={updateStatus.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() =>
                              updateStatus.mutate({ id: review.id, status: "rejected" })
                            }
                            disabled={updateStatus.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {review.status === "published" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-700 border-red-200 hover:bg-red-50 shrink-0"
                          onClick={() =>
                            updateStatus.mutate({ id: review.id, status: "rejected" })
                          }
                          disabled={updateStatus.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Unpublish
                        </Button>
                      )}
                      {review.status === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-200 hover:bg-green-50 shrink-0"
                          onClick={() =>
                            updateStatus.mutate({ id: review.id, status: "published" })
                          }
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
