import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Sparkles, ArrowLeft, Calendar, Mail, Phone, DollarSign, Cake, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  quoted: "bg-purple-100 text-purple-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminInquiries() {
  const { user, isAuthenticated } = useAuth();
  const { data: inquiries, isLoading, refetch } = trpc.inquiries.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateStatusMutation = trpc.inquiries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center space-y-6">
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <p className="text-muted-foreground">Please sign in with an admin account</p>
            <a href={getLoginUrl()}><Button size="lg">Sign In</Button></a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center space-y-6">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page</p>
            <Link href="/"><Button>Go Home</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({
      id,
      status: status as "new" | "contacted" | "quoted" | "confirmed" | "completed" | "cancelled",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Custom Order <span className="text-gradient-gold">Inquiries</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage custom order requests from the AI chatbot
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading inquiries...</p>
            </div>
          ) : !inquiries || inquiries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Inquiries Yet</h3>
                <p className="text-muted-foreground">
                  Custom order inquiries from the chatbot will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 pb-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Cake className="h-5 w-5 text-pink-500" />
                          {inquiry.inquiryNumber}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[inquiry.status] || "bg-gray-100"}>
                          {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                        </Badge>
                        <Select
                          value={inquiry.status}
                          onValueChange={(value) => handleStatusChange(inquiry.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="quoted">Quoted</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          Customer Information
                        </h4>
                        <div className="space-y-2">
                          <p className="font-medium">{inquiry.customerName || "Not provided"}</p>
                          {inquiry.customerEmail && (
                            <p className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${inquiry.customerEmail}`} className="text-primary hover:underline">
                                {inquiry.customerEmail}
                              </a>
                            </p>
                          )}
                          {inquiry.customerPhone && (
                            <p className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a href={`tel:${inquiry.customerPhone}`} className="text-primary hover:underline">
                                {inquiry.customerPhone}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          Order Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          {inquiry.eventDate && (
                            <p className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              Event: {new Date(inquiry.eventDate).toLocaleDateString()}
                            </p>
                          )}
                          {inquiry.eventType && (
                            <p><span className="text-muted-foreground">Type:</span> {inquiry.eventType}</p>
                          )}
                          {inquiry.quantity && (
                            <p><span className="text-muted-foreground">Quantity:</span> {inquiry.quantity}</p>
                          )}
                          {inquiry.flavorPreferences && (
                            <p><span className="text-muted-foreground">Flavors:</span> {inquiry.flavorPreferences}</p>
                          )}
                          {inquiry.designTheme && (
                            <p><span className="text-muted-foreground">Design:</span> {inquiry.designTheme}</p>
                          )}
                          {inquiry.budgetRange && (
                            <p><span className="text-muted-foreground">Budget:</span> {inquiry.budgetRange}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estimate */}
                    {(inquiry.estimatedPrice || inquiry.estimateDetails) && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                          Estimate Provided
                        </h4>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="text-lg font-bold text-green-600">
                            {inquiry.estimatedPrice ? `$${inquiry.estimatedPrice}` : "TBD"}
                          </span>
                          {inquiry.estimateDetails && (
                            <span className="text-sm text-muted-foreground">
                              - {inquiry.estimateDetails}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Image Attachments */}
                    {inquiry.imageAttachments && (() => {
                      try {
                        const images = JSON.parse(inquiry.imageAttachments as string);
                        if (Array.isArray(images) && images.length > 0) {
                          return (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Inspiration Images ({images.length})
                              </h4>
                              <div className="flex flex-wrap gap-3">
                                {images.map((img: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={img}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={img}
                                      alt={`Inspiration ${idx + 1}`}
                                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:border-pink-400 transition-colors"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        // Invalid JSON, skip
                      }
                      return null;
                    })()}

                    {/* Additional Notes */}
                    {inquiry.additionalNotes && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                          Additional Notes
                        </h4>
                        <p className="text-sm">{inquiry.additionalNotes}</p>
                      </div>
                    )}
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
