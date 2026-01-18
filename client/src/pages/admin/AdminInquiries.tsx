import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { 
  Sparkles, ArrowLeft, Calendar, Mail, Phone, DollarSign, Cake, ImageIcon, 
  MessageSquare, X, ChevronDown, ChevronUp, BarChart3, AlertTriangle, 
  TrendingUp, Clock, CheckCircle2, Copy, Send
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  quoted: "bg-purple-100 text-purple-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

// Quick response templates
const responseTemplates = [
  {
    name: "Initial Response",
    subject: "Re: Your Custom Order Inquiry",
    body: `Hi [Customer Name],

Thank you for reaching out to Fairytale Farms Bakery! I received your inquiry and I'm excited to help create something special for you.

I'd love to discuss the details of your order. Based on what you've shared, here's what I'm thinking:

[Order Details]

Please let me know if you have any questions or would like to make any changes. I'll follow up with a final quote once we've confirmed all the details.

Best,
Fairytale Farms Bakery`,
  },
  {
    name: "Quote Follow-up",
    subject: "Your Custom Order Quote",
    body: `Hi [Customer Name],

Thank you for your patience! Here's your custom order quote:

[Item Description]
Price: $[Amount]

This includes [details]. The order will be ready for pickup/delivery on [Date].

To confirm your order, please reply to this email. A 50% deposit is required to secure your date.

Let me know if you have any questions!

Best,
Fairytale Farms Bakery`,
  },
  {
    name: "Order Confirmation",
    subject: "Order Confirmed!",
    body: `Hi [Customer Name],

Great news! Your order is confirmed! 🎉

Order Details:
[Order Summary]

Pickup/Delivery: [Date & Time]
Total: $[Amount]

I'll send you a reminder the day before. If you need to make any changes, please let me know at least 48 hours in advance.

Thank you for choosing Fairytale Farms Bakery!

Best,
Fairytale Farms Bakery`,
  },
];

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
        <div className="flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Conversation History</h3>
              <p className="text-xs text-pink-100">{inquiryNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

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
              <div key={message.id} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-md"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                <span className="text-[10px] mt-1 px-1 text-gray-400">
                  {new Date(message.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-3">
          <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
}

function TemplateModal({ 
  customerEmail,
  customerName,
  onClose 
}: { 
  customerEmail: string;
  customerName: string;
  onClose: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  
  const template = responseTemplates[selectedTemplate];
  const filledBody = template.body
    .replace(/\[Customer Name\]/g, customerName || "there");

  const handleCopy = () => {
    navigator.clipboard.writeText(filledBody);
    toast.success("Template copied to clipboard!");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(filledBody);
    window.open(`mailto:${customerEmail}?subject=${subject}&body=${body}`, '_blank');
    toast.success("Opening email client...");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Quick Response Templates</h3>
              <p className="text-xs text-purple-100">Send to: {customerEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex gap-2 flex-wrap">
            {responseTemplates.map((t, idx) => (
              <Button
                key={idx}
                variant={selectedTemplate === idx ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTemplate(idx)}
              >
                {t.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm font-medium text-gray-500 mb-2">Subject: {template.subject}</p>
            <pre className="text-sm whitespace-pre-wrap font-sans text-gray-700">{filledBody}</pre>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-3 flex gap-2">
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
          <Button onClick={handleEmail} className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500">
            <Mail className="h-4 w-4 mr-2" /> Send Email
          </Button>
        </div>
      </div>
    </div>
  );
}

function AnalyticsDashboard() {
  const { data: analytics, isLoading } = trpc.inquiries.analytics.useQuery();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  const statusLabels: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    quoted: "Quoted",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalInquiries}</p>
                <p className="text-xs text-muted-foreground">Total Inquiries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.byStatus?.confirmed || 0}</p>
                <p className="text-xs text-muted-foreground">Confirmed Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={analytics.overdueCount > 0 ? "border-red-300 bg-red-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${analytics.overdueCount > 0 ? "bg-red-100" : "bg-orange-100"}`}>
                <AlertTriangle className={`h-5 w-5 ${analytics.overdueCount > 0 ? "text-red-600" : "text-orange-600"}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.overdueCount}</p>
                <p className="text-xs text-muted-foreground">Overdue (24hr+)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="text-center p-3 rounded-lg bg-gray-50">
                <Badge className={`${statusColors[key]} mb-2`}>{label}</Badge>
                <p className="text-xl font-bold">{analytics.byStatus?.[key] || 0}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 30-Day Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {analytics.byDay?.map((day, idx) => {
              const maxCount = Math.max(...(analytics.byDay?.map(d => d.count) || [1]), 1);
              const height = day.count > 0 ? Math.max((day.count / maxCount) * 100, 10) : 4;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-gradient-to-t from-pink-500 to-rose-400 rounded-t hover:from-pink-600 hover:to-rose-500 transition-colors cursor-pointer group relative"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.count} inquiries`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InquiryCard({ 
  inquiry, 
  isSelected,
  onSelect,
  onStatusChange,
  onViewConversation,
  onOpenTemplates,
}: { 
  inquiry: any;
  isSelected: boolean;
  onSelect: (id: number, selected: boolean) => void;
  onStatusChange: (id: number, status: string) => void;
  onViewConversation: (id: number, inquiryNumber: string) => void;
  onOpenTemplates: (email: string, name: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if overdue (new status and older than 24 hours)
  const isOverdue = inquiry.status === 'new' && 
    new Date(inquiry.createdAt) < new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (
    <Card className={`overflow-hidden ${isOverdue ? "border-red-300 bg-red-50/50" : ""}`}>
      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(inquiry.id, !!checked)}
            />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cake className="h-5 w-5 text-pink-500" />
                {inquiry.inquiryNumber}
                {isOverdue && (
                  <Badge className="bg-red-100 text-red-800 ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Overdue
                  </Badge>
                )}
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
            </div>
          </div>
        </div>

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
                <span className="text-sm text-muted-foreground">- {inquiry.estimateDetails}</span>
              )}
            </div>
          </div>
        )}

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
                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block">
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
                } catch (e) {}
                return null;
              })()}

              {inquiry.additionalNotes && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                    Additional Notes
                  </h4>
                  <p className="text-sm">{inquiry.additionalNotes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewConversation(inquiry.id, inquiry.inquiryNumber)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  View Conversation
                </Button>
                {inquiry.customerEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenTemplates(inquiry.customerEmail, inquiry.customerName)}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Quick Response
                  </Button>
                )}
              </div>
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
  const [templateModal, setTemplateModal] = useState<{ email: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("inquiries");
  
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

  const bulkUpdateMutation = trpc.inquiries.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated ${data.updated} inquiries`);
      setSelectedIds(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
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

  const handleBulkStatusChange = (status: string) => {
    if (selectedIds.size === 0) {
      toast.error("No inquiries selected");
      return;
    }
    bulkUpdateMutation.mutate({
      ids: Array.from(selectedIds),
      status: status as "new" | "contacted" | "quoted" | "confirmed" | "completed" | "cancelled",
    });
  };

  const handleSelect = (id: number, selected: boolean) => {
    const newSet = new Set(selectedIds);
    if (selected) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === inquiries?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(inquiries?.map(i => i.id) || []));
    }
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="inquiries" className="flex items-center gap-2">
                <Cake className="h-4 w-4" />
                Inquiries
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="inquiries">
              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                <Card className="mb-4 bg-blue-50 border-blue-200">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <p className="text-sm font-medium">
                        {selectedIds.size} inquiry{selectedIds.size > 1 ? "ies" : ""} selected
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Bulk update to:</span>
                        <Select onValueChange={handleBulkStatusChange}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="quoted">Quoted</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                  {/* Select All */}
                  <div className="flex items-center gap-2 px-2">
                    <Checkbox
                      checked={selectedIds.size === inquiries.length && inquiries.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select all ({inquiries.length})
                    </span>
                  </div>

                  {inquiries.map((inquiry) => (
                    <InquiryCard
                      key={inquiry.id}
                      inquiry={inquiry}
                      isSelected={selectedIds.has(inquiry.id)}
                      onSelect={handleSelect}
                      onStatusChange={handleStatusChange}
                      onViewConversation={(id, num) => setSelectedInquiry({ id, inquiryNumber: num })}
                      onOpenTemplates={(email, name) => setTemplateModal({ email, name })}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {selectedInquiry && (
        <ConversationModal
          inquiryId={selectedInquiry.id}
          inquiryNumber={selectedInquiry.inquiryNumber}
          onClose={() => setSelectedInquiry(null)}
        />
      )}

      {templateModal && (
        <TemplateModal
          customerEmail={templateModal.email}
          customerName={templateModal.name}
          onClose={() => setTemplateModal(null)}
        />
      )}
    </div>
  );
}
