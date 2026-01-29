import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, User, Calendar } from "lucide-react";

export default function AdminContacts() {
  const { user, isAuthenticated } = useAuth();
  const { data: contacts, isLoading } = trpc.admin.allContacts.useQuery(
    undefined,
    {
      enabled: isAuthenticated && user?.role === "admin",
    }
  );

  const utils = trpc.useUtils();

  const markReadMutation = trpc.admin.markContactRead.useMutation({
    onSuccess: () => {
      utils.admin.allContacts.invalidate();
      toast.success("Message marked as read");
    },
    onError: error => {
      toast.error(error.message || "Failed to mark as read");
    },
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
            Contact <span className="text-gradient-gold">Messages</span>
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No contact messages</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map(contact => (
                <Card
                  key={contact.id}
                  className={contact.status === "new" ? "border-primary" : ""}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            {contact.subject && (
                              <h3 className="font-bold text-lg">
                                {contact.subject}
                              </h3>
                            )}
                            {contact.status === "new" && <Badge>New</Badge>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {contact.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {contact.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(contact.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                        {contact.status === "new" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              markReadMutation.mutate({ id: contact.id })
                            }
                            disabled={markReadMutation.isPending}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">
                          {contact.message}
                        </p>
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
