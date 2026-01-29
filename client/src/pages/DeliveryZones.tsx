import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  MapPin,
  Check,
  X,
  ArrowLeft,
  Truck,
  Clock,
  Heart,
  Search,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function DeliveryZones() {
  const [zipCode, setZipCode] = useState("");
  const [checked, setChecked] = useState(false);

  const {
    data: validation,
    isLoading,
    refetch,
  } = trpc.valentines.validateDeliveryZone.useQuery(
    { zipCode },
    { enabled: false }
  );

  const { data: zones } = trpc.valentines.deliveryZones.useQuery();

  const handleCheck = async () => {
    if (zipCode.length !== 5) return;
    setChecked(true);
    refetch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCheck();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-rainbow-soft py-12">
        <div className="container">
          <Link
            href="/valentines"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Valentine's Collection
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-pastel flex items-center justify-center">
              <MapPin className="w-8 h-8 text-pink-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Delivery Zone Checker
              </h1>
              <p className="text-muted-foreground">
                Check if we deliver to your area
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* ZIP Code Checker */}
          <Card className="shadow-pastel mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Enter Your ZIP Code</CardTitle>
              <CardDescription>
                We deliver within a 30-mile radius of Goodlettsville, TN
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter 5-digit ZIP code"
                    value={zipCode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                      setZipCode(val);
                      setChecked(false);
                    }}
                    onKeyPress={handleKeyPress}
                    className="text-center text-xl font-mono tracking-widest h-14"
                    maxLength={5}
                  />
                </div>
                <Button
                  onClick={handleCheck}
                  disabled={zipCode.length !== 5 || isLoading}
                  size="lg"
                  className="h-14 px-8"
                >
                  {isLoading ? (
                    "Checking..."
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Check
                    </>
                  )}
                </Button>
              </div>

              {/* Result */}
              {checked && validation && (
                <div className="mt-6">
                  {validation.valid ? (
                    <Alert className="border-green-200 bg-green-50">
                      <Check className="h-5 w-5 text-green-600" />
                      <AlertTitle className="text-green-700 text-lg">
                        Great news!
                      </AlertTitle>
                      <AlertDescription className="text-green-600">
                        <p className="mb-3">
                          We deliver to ZIP code <strong>{zipCode}</strong>!
                        </p>
                        {validation.zone && (
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>City:</strong>{" "}
                              {validation.zone.city || "Your area"}
                            </p>
                            <p>
                              <strong>Delivery Fee:</strong> $
                              {validation.zone.deliveryFee || "0.00"}
                            </p>
                          </div>
                        )}
                        <div className="mt-4">
                          <Link href="/valentines">
                            <Button className="bg-green-600 hover:bg-green-700">
                              <Heart className="w-4 h-4 mr-2" />
                              Shop Valentine's Collection
                            </Button>
                          </Link>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <X className="h-5 w-5" />
                      <AlertTitle className="text-lg">
                        Outside Delivery Area
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mb-3">
                          Unfortunately, ZIP code <strong>{zipCode}</strong> is
                          outside our current delivery zone.
                        </p>
                        <p className="text-sm">
                          {validation.reason ||
                            "We currently deliver within a 30-mile radius of Goodlettsville, TN."}
                        </p>
                        <p className="mt-3 text-sm">
                          Have questions?{" "}
                          <Link href="/contact" className="underline">
                            Contact us
                          </Link>{" "}
                          to discuss options.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="text-center p-6">
              <Truck className="w-10 h-10 text-pink-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Free Local Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Within 10 miles of Goodlettsville
              </p>
            </Card>

            <Card className="text-center p-6">
              <Clock className="w-10 h-10 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Feb 13-14 Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Choose your preferred date
              </p>
            </Card>

            <Card className="text-center p-6">
              <MapPin className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">30-Mile Radius</h3>
              <p className="text-sm text-muted-foreground">
                Nashville & surrounding areas
              </p>
            </Card>
          </div>

          {/* Delivery Zones List */}
          {zones && zones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Zones</CardTitle>
                <CardDescription>
                  Delivery fees based on distance from Goodlettsville, TN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {zones.map(zone => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <h4 className="font-medium">
                          {zone.city || zone.zipCode}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          ZIP: {zone.zipCode}
                        </p>
                      </div>
                      <Badge
                        variant={
                          parseFloat(zone.deliveryFee || "0") === 0
                            ? "default"
                            : "secondary"
                        }
                      >
                        {parseFloat(zone.deliveryFee || "0") === 0
                          ? "FREE"
                          : `$${zone.deliveryFee}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Areas We Serve */}
          <Card className="mt-8 bg-muted/30">
            <CardHeader>
              <CardTitle>Areas We Serve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {[
                  "Nashville",
                  "Franklin",
                  "Murfreesboro",
                  "Brentwood",
                  "Hendersonville",
                  "Gallatin",
                  "Mt. Juliet",
                  "Lebanon",
                  "Smyrna",
                  "La Vergne",
                  "Spring Hill",
                  "Nolensville",
                  "Goodlettsville",
                  "Madison",
                  "Hermitage",
                  "Antioch",
                  "Bellevue",
                  "Green Hills",
                  "Berry Hill",
                  "Oak Hill",
                ].map(city => (
                  <div key={city} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{city}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Not sure if we deliver to your area? Enter your ZIP code above
                or contact us!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
