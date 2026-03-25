import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Image,
  Clock,
} from "lucide-react";

export default function AdminPhotoReviews() {
  const { user, isAuthenticated } = useAuth();
  const { data: photos, isLoading } =
    trpc.valentines.pendingPhotos.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const utils = trpc.useUtils();

  const updateStatusMutation =
    trpc.valentines.updatePhotoStatus.useMutation({
      onSuccess: () => {
        utils.valentines.pendingPhotos.invalidate();
        toast.success("Photo status updated");
      },
      onError: (e) => toast.error(e.message || "Failed to update"),
    });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center space-y-6">
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container">
          <Link href="/admin">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Photo <span className="text-gradient-gold">Reviews</span>
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !photos || photos.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No photos pending review
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {photos.length} photo{photos.length !== 1 ? "s" : ""} pending
                review
              </p>
              {photos.map((photo: any) => (
                <Card key={photo.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {photo.fileUrl ? (
                          <img
                            src={photo.fileUrl}
                            alt={photo.fileName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{photo.fileName}</span>
                          <Badge
                            variant={
                              photo.status === "approved"
                                ? "default"
                                : photo.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {photo.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Order ID: {photo.orderId}</p>
                          <p>
                            Size:{" "}
                            {photo.fileSize
                              ? `${(photo.fileSize / 1024 / 1024).toFixed(1)} MB`
                              : "Unknown"}
                          </p>
                          <p>Type: {photo.mimeType}</p>
                          {photo.createdAt && (
                            <p>
                              Uploaded:{" "}
                              {new Date(photo.createdAt).toLocaleDateString()}
                            </p>
                          )}
                          {photo.reviewNotes && (
                            <p className="text-xs italic">
                              Notes: {photo.reviewNotes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            disabled={updateStatusMutation.isPending}
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: photo.id,
                                status: "approved",
                              })
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => {
                              const notes = prompt("Rejection reason (optional):");
                              updateStatusMutation.mutate({
                                id: photo.id,
                                status: "rejected",
                                reviewNotes: notes || undefined,
                              });
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
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
    </div>
  );
}
