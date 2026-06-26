import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ImageIcon,
  ZoomIn,
  X,
  Clock,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";

type PhotoStatus = "pending_review" | "approved" | "rejected";

const STATUS_STYLES: Record<PhotoStatus, string> = {
  pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<PhotoStatus, string> = {
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminPhotos() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});
  const [rejectOpen, setRejectOpen] = useState<Record<number, boolean>>({});

  const { data: photos, isLoading } = trpc.customPortrait.pendingPhotos.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateStatus = trpc.customPortrait.updatePhotoStatus.useMutation({
    onSuccess: (_, vars) => {
      const action = vars.status === "approved" ? "approved" : "rejected";
      toast.success(`Photo ${action}.`);
      utils.customPortrait.pendingPhotos.invalidate();
      setRejectOpen(prev => ({ ...prev, [vars.id]: false }));
      setRejectNotes(prev => ({ ...prev, [vars.id]: "" }));
    },
    onError: err => {
      toast.error(err.message || "Failed to update photo status");
    },
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center">
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <Link href="/">
              <Button className="mt-4">Go Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleApprove = (id: number) => {
    updateStatus.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    const notes = rejectNotes[id]?.trim();
    updateStatus.mutate({ id, status: "rejected", reviewNotes: notes || undefined });
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
            Photo <span className="text-gradient-gold">Review</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Review customer-uploaded photos for custom portrait puck orders.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {photos?.length ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Photos Awaiting Review</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !photos || photos.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
              <p className="text-muted-foreground">
                No photos are currently awaiting review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {photos.map(photo => (
                <Card key={photo.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Photo thumbnail */}
                      <div
                        className="w-full md:w-48 h-48 bg-muted flex-shrink-0 relative group cursor-zoom-in"
                        onClick={() => setLightboxUrl(photo.fileUrl)}
                      >
                        <img
                          src={photo.fileUrl}
                          alt={photo.fileName}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-1.5 shadow">
                            <ZoomIn className="h-4 w-4 text-gray-700" />
                          </div>
                        </div>
                      </div>

                      {/* Info & actions */}
                      <div className="flex-1 p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">
                                Order #{photo.orderId}
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[photo.status as PhotoStatus]}`}
                              >
                                {STATUS_LABELS[photo.status as PhotoStatus] ?? photo.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <FileImage className="h-3.5 w-3.5" />
                              <span>{photo.fileName}</span>
                              <span>·</span>
                              <span>{formatBytes(photo.fileSize)}</span>
                              <span>·</span>
                              <span className="uppercase text-xs">{photo.mimeType.split("/")[1]}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {new Date(photo.createdAt).toLocaleString()}
                            </p>
                          </div>

                          {/* Action buttons */}
                          {photo.status === "pending_review" && !rejectOpen[photo.id] && (
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-700 border-green-200 hover:bg-green-50"
                                onClick={() => handleApprove(photo.id)}
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
                                  setRejectOpen(prev => ({ ...prev, [photo.id]: true }))
                                }
                                disabled={updateStatus.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Reject notes form */}
                        {rejectOpen[photo.id] && (
                          <div className="space-y-2 border-t pt-3">
                            <p className="text-sm font-medium text-red-700">
                              Rejection reason (optional — will be visible to customer):
                            </p>
                            <Textarea
                              placeholder="e.g. Image is too blurry or low resolution for printing..."
                              value={rejectNotes[photo.id] ?? ""}
                              onChange={e =>
                                setRejectNotes(prev => ({
                                  ...prev,
                                  [photo.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              className="resize-none text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-700 border-red-200 hover:bg-red-50"
                                onClick={() => handleReject(photo.id)}
                                disabled={updateStatus.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Confirm Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setRejectOpen(prev => ({ ...prev, [photo.id]: false }))
                                }
                                disabled={updateStatus.isPending}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Show existing review notes */}
                        {photo.reviewNotes && (
                          <div className="text-sm text-muted-foreground border-t pt-2">
                            <span className="font-medium">Notes: </span>
                            {photo.reviewNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            onClick={e => {
              e.stopPropagation();
              setLightboxUrl(null);
            }}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size photo"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
