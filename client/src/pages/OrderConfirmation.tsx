import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";

function getQueryParam(search: string, key: string) {
  const params = new URLSearchParams(search);
  return params.get(key);
}

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:orderNumber");
  const [location, setLocation] = useLocation();
  const { user, refresh, isAuthenticated, hasSession } = useAuth();
  const search = useMemo(() => location.split("?")[1] || "", [location]);
  const sessionId = useMemo(
    () => getQueryParam(search, "session_id"),
    [search]
  );
  const emailFromQuery = useMemo(
    () => getQueryParam(search, "email") || "",
    [search]
  );
  const orderId = useMemo(
    () => getQueryParam(search, "orderId") || "",
    [search]
  );

  const shouldFetchOrder = Boolean(sessionId && hasSession);
  const { data: sessionOrder, isLoading } =
    trpc.orders.getByCheckoutSession.useQuery(
      { sessionId: sessionId ?? "" },
      {
        enabled: shouldFetchOrder,
        refetchInterval: query => (query.state.data ? false : 3000),
        retry: true,
      }
    );

  const [email, setEmail] = useState(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("lastCheckoutEmail")
        : "";
    return (emailFromQuery || saved || user?.email || "")
      .trim()
      .toLowerCase();
  });
  const [step, setStep] = useState<"idle" | "sent" | "verifying">("idle");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string>("");
  const [devCode, setDevCode] = useState<string>("");

  const orderNumber = params?.orderNumber ?? sessionOrder?.orderNumber ?? "";
  const showLoading = shouldFetchOrder && isLoading && !sessionOrder;
  const showPending = Boolean(sessionId && !orderNumber && !showLoading);

  useEffect(() => {
    if (!emailFromQuery) return;
    const normalized = emailFromQuery.trim().toLowerCase();
    if (typeof window !== "undefined") {
      localStorage.setItem("lastCheckoutEmail", normalized);
    }
  }, [emailFromQuery]);

  useEffect(() => {
    if (email || !sessionOrder?.customerEmail) return;
    const normalized = sessionOrder.customerEmail.trim().toLowerCase();
    setEmail(normalized);
    if (typeof window !== "undefined") {
      localStorage.setItem("lastCheckoutEmail", normalized);
    }
  }, [email, sessionOrder]);

  async function requestCode() {
    if (!email) {
      setMessage("Please enter the email you used at checkout.");
      return;
    }

    setMessage("");
    setDevCode("");

    if (typeof window !== "undefined") {
      localStorage.setItem("lastCheckoutEmail", email.trim().toLowerCase());
    }

    const res = await fetch("/api/auth/request-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data?.error || "Failed to request code.");
      return;
    }

    if (data?.devCode) setDevCode(String(data.devCode));
    setStep("sent");
    setMessage("Code sent. Check your email.");
  }

  async function verify() {
    if (!email || code.length !== 6) return;

    setMessage("");
    setStep("verifying");

    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStep("sent");
      setMessage(data?.error || "Invalid code.");
      return;
    }

    await refresh?.();
    setMessage("You're in. Redirecting…");
    setLocation("/my-orders");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container max-w-2xl space-y-8">
          <Card className="text-center">
            <CardContent className="p-12 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Order Confirmed!</h1>
                <p className="text-lg text-muted-foreground">
                  Thank you for your order
                </p>
              </div>
              {orderNumber ? (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Order Number
                  </p>
                  <p className="text-2xl font-bold font-mono">
                    {orderNumber}
                  </p>
                </div>
              ) : orderId ? (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Order ID
                  </p>
                  <p className="text-2xl font-bold font-mono">{orderId}</p>
                </div>
              ) : null}
              {showLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Confirming your order details...</span>
                </div>
              )}
              {showPending && (
                <div className="text-sm text-muted-foreground">
                  We are finalizing your order. If it does not appear shortly,
                  check My Orders.
                </div>
              )}
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">What's Next?</p>
                    <p className="text-sm text-muted-foreground">
                      We've received your order and will begin preparing your
                      items.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                {isAuthenticated ? (
                  <Link href="/my-orders">
                    <Button size="lg">
                      Track this order
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    onClick={() =>
                      document
                        .getElementById("claim-account")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Claim your account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Link href="/products">
                  <Button size="lg" variant="outline">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {!isAuthenticated && (
            <Card id="claim-account">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Claim your account</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a quick sign-in so you can track orders and manage
                    your account — no password needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase text-muted-foreground">
                    Email used at checkout
                  </label>
                  <input
                    value={email}
                    onChange={e =>
                      setEmail(e.target.value.trim().toLowerCase())
                    }
                    placeholder="you@email.com"
                    type="email"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                {step === "idle" ? (
                  <Button onClick={requestCode} disabled={!email}>
                    Send login code
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs uppercase text-muted-foreground">
                        Enter the 6-digit code
                      </label>
                      <input
                        value={code}
                        onChange={e =>
                          setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="123456"
                        inputMode="numeric"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm tracking-[0.3em]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={verify}
                        disabled={code.length !== 6 || step === "verifying"}
                      >
                        {step === "verifying"
                          ? "Verifying…"
                          : "Verify & sign in"}
                      </Button>
                      <Button variant="outline" onClick={requestCode}>
                        Resend
                      </Button>
                    </div>
                    {devCode ? (
                      <p className="text-xs text-muted-foreground">
                        Dev-only code: <strong>{devCode}</strong>
                      </p>
                    ) : null}
                  </div>
                )}

                {message ? (
                  <p className="text-sm text-muted-foreground">{message}</p>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  Prefer not to create an account? No problem — you’ll still
                  receive email updates.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
