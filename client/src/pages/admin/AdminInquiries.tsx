import { useState } from "react";
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
import { Sparkles, ArrowLeft, Calendar, Mail, Phone, DollarSign, Cake, ImageIcon, MessageSquare, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  quoted: "bg-purple-100 text-purple-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

interface ConversationMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

function ConversationModal({ 
  inquiryId, 
  inquiryNumber, 
  onClose 
}: { 
  inquiryId: number; 
  inquiryNumber: string; 
  onClose: () => void;
}) {
  const { data: messages, isLoading } = trpc.inquiries.getConversation.useQuery(
    { inquiryId },
    { enabled: !!inquiryId }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Conversation History</h3>
              <p className="text-xs text-pink-100">{inquiryNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading conversation...</p>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversation history found</p>
            </div>
          ) : (
            messages.map((message: ConversationMessage) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-md"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                <span className="text-[10px] mt-1 px-1 text-gray-400">
                  {new Date(message.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white px-6 py-3">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function InquiryCard({ 
  inquiry, 
  onStatusChange,
  onViewConversation,
}: { 
  inquiry: any;
  onStatusChange: (id: number, status: string) => void;
  onViewConversation: (id: number, inquiryNumber: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
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
              onValueChange={(value) => onStatusChange(inquiry.id, value)}
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

        {/* Expandable section */}
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? "Hide details" : "Show more details"}
          </button>

          {isExpanded && (
            <div className="mt-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              {/* Image Attachments */}
              {inquiry.imageAttachments && (() => {
                try {
                  const images = JSON.parse(inquiry.imageAttachments as string);
                  if (Array.isArray(images) && images.length > 0) {
                    return (
                      <div>
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
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                    Additional Notes
                  </h4>
                  <p className="text-sm">{inquiry.additionalNotes}</p>
                </div>
              )}

              {/* View Conversation Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewConversation(inquiry.id, inquiry.inquiryNumber)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                View Full Conversation
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminInquiries() {
  const { user, isAuthenticated } = useAuth();
  const [selectedInquiry, setSelectedInquiry] = useState<{ id: number; inquiryNumber: string } | null>(null);
  
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

  const handleViewConversation = (id: number, inquiryNumber: string) => {
    setSelectedInquiry({ id, inquiryNumber });
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
                <InquiryCard
                  key={inquiry.id}
                  inquiry={inquiry}
                  onStatusChange={handleStatusChange}
                  onViewConversation={handleViewConversation}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Conversation Modal */}
      {selectedInquiry && (
        <ConversationModal
          inquiryId={selectedInquiry.id}
          inquiryNumber={selectedInquiry.inquiryNumber}
          onClose={() => setSelectedInquiry(null)}
        />
      )}
    </div>
  );
}
