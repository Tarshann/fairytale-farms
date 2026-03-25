import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus, Trash2, MapPin } from "lucide-react";

export default function AdminDeliveryZones() {
  const { user, isAuthenticated } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newZipCode, setNewZipCode] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newFee, setNewFee] = useState("0.00");

  const { data: zones, isLoading } =
    trpc.deliveryZonesAdmin.list.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const utils = trpc.useUtils();

  const createMutation = trpc.deliveryZonesAdmin.create.useMutation({
    onSuccess: () => {
      utils.deliveryZonesAdmin.list.invalidate();
      toast.success("Delivery zone added");
      setShowCreate(false);
      setNewZipCode("");
      setNewCity("");
      setNewState("");
      setNewFee("0.00");
    },
    onError: (e) => toast.error(e.message || "Failed to add zone"),
  });

  const updateMutation = trpc.deliveryZonesAdmin.update.useMutation({
    onSuccess: () => {
      utils.deliveryZonesAdmin.list.invalidate();
      toast.success("Zone updated");
    },
    onError: (e) => toast.error(e.message || "Failed to update"),
  });

  const deleteMutation = trpc.deliveryZonesAdmin.delete.useMutation({
    onSuccess: () => {
      utils.deliveryZonesAdmin.list.invalidate();
      toast.success("Zone deleted");
    },
    onError: (e) => toast.error(e.message || "Failed to delete"),
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

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">
              Delivery <span className="text-gradient-gold">Zones</span>
            </h1>
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Zone
            </Button>
          </div>

          {showCreate && (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <CardTitle>Add Delivery Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>ZIP Code *</Label>
                    <Input
                      placeholder="30301"
                      value={newZipCode}
                      onChange={(e) => setNewZipCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="Atlanta"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      placeholder="GA"
                      maxLength={2}
                      value={newState}
                      onChange={(e) =>
                        setNewState(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Fee ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => {
                      if (!newZipCode.trim()) {
                        toast.error("ZIP code is required");
                        return;
                      }
                      createMutation.mutate({
                        zipCode: newZipCode.trim(),
                        city: newCity || undefined,
                        state: newState || undefined,
                        deliveryFee: newFee || "0.00",
                        isActive: true,
                      });
                    }}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Adding..." : "Add Zone"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !zones || zones.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No delivery zones. Add your first one above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                {zones.length} delivery zone{zones.length !== 1 ? "s" : ""}
              </p>
              {zones.map((zone) => (
                <Card
                  key={zone.id}
                  className={!zone.isActive ? "opacity-60" : ""}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-bold">{zone.zipCode}</code>
                            {zone.city && (
                              <span className="text-sm text-muted-foreground">
                                {zone.city}
                                {zone.state ? `, ${zone.state}` : ""}
                              </span>
                            )}
                            <Badge variant="outline">
                              ${parseFloat(zone.deliveryFee ?? "0").toFixed(2)}{" "}
                              fee
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={zone.isActive}
                            disabled={updateMutation.isPending}
                            onCheckedChange={(checked) =>
                              updateMutation.mutate({
                                id: zone.id,
                                isActive: checked,
                              })
                            }
                          />
                          <span className="text-xs">Active</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              confirm(
                                `Delete zone ${zone.zipCode}? This cannot be undone.`
                              )
                            ) {
                              deleteMutation.mutate({ id: zone.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
