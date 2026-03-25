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
  Shield,
  ShieldCheck,
  User,
  Mail,
  Calendar,
} from "lucide-react";

export default function AdminUsers() {
  const { user, isAuthenticated } = useAuth();
  const { data: allUsers, isLoading } = trpc.admin.allUsers.useQuery(
    undefined,
    {
      enabled: isAuthenticated && user?.role === "admin",
    }
  );

  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      utils.admin.allUsers.invalidate();
      toast.success("User role updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user role");
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
            User <span className="text-gradient-gold">Management</span>
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !allUsers || allUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No users found
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                {allUsers.length} registered user{allUsers.length !== 1 ? "s" : ""}
              </p>
              {allUsers.map((u) => (
                <Card key={u.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">
                            {u.name || "Unnamed"}
                          </span>
                          <Badge
                            variant={u.role === "admin" ? "default" : "secondary"}
                            className="flex-shrink-0"
                          >
                            {u.role === "admin" ? (
                              <ShieldCheck className="h-3 w-3 mr-1" />
                            ) : null}
                            {u.role}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{u.email || "No email"}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined{" "}
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : "Unknown"}
                          </span>
                          <span>
                            Last active:{" "}
                            {u.lastSignedIn
                              ? new Date(u.lastSignedIn).toLocaleDateString()
                              : "Never"}
                          </span>
                          {u.loginMethod && (
                            <Badge variant="outline" className="text-xs">
                              {u.loginMethod}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {u.role === "admin" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              updateRoleMutation.isPending || u.id === user?.id
                            }
                            onClick={() =>
                              updateRoleMutation.mutate({
                                userId: u.id,
                                role: "user",
                              })
                            }
                            title={
                              u.id === user?.id
                                ? "You cannot remove your own admin role"
                                : "Revoke admin access"
                            }
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Revoke Admin
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={updateRoleMutation.isPending}
                            onClick={() =>
                              updateRoleMutation.mutate({
                                userId: u.id,
                                role: "admin",
                              })
                            }
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Make Admin
                          </Button>
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
    </div>
  );
}
