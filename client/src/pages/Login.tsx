import { useState, type FormEvent } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const requestCode = trpc.auth.requestLoginCode.useMutation({
    onSuccess: data => {
      setCodeSent(true);
      setDevCode(data.devCode ?? null);
      toast.success("Your sign-in code is on the way.");
    },
    onError: error => {
      toast.error(error.message || "Unable to send code.");
    },
  });

  const verifyCode = trpc.auth.verifyLoginCode.useMutation({
    onSuccess: () => {
      toast.success("You're signed in!");
      setLocation("/account/orders");
    },
    onError: error => {
      toast.error(error.message || "Invalid code.");
    },
  });

  const handleRequestCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    requestCode.mutate({ email });
  };

  const handleVerifyCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    verifyCode.mutate({ email, code });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f2]">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container flex justify-center">
          <Card className="w-full max-w-md shadow-md">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <img
                  src="/images/fairytale-farms-logo.png"
                  alt="Fairytale Farms"
                  className="h-10 w-auto object-contain"
                />
                <Link href="/products">
                  <a className="text-sm text-muted-foreground hover:text-primary">
                    Continue shopping
                  </a>
                </Link>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Welcome back 🍪</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we’ll send a secure sign-in code. No
                  passwords, ever.
                </p>
              </div>

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the email you used at checkout.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={requestCode.isPending}
                >
                  {requestCode.isPending ? "Sending..." : "Send sign-in code"}
                </Button>
              </form>

              {codeSent && (
                <form
                  onSubmit={handleVerifyCode}
                  className="space-y-4 border-t border-border pt-4"
                >
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code we emailed you.
                  </p>
                  <Input
                    id="login-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={event => setCode(event.target.value)}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={verifyCode.isPending}
                  >
                    {verifyCode.isPending
                      ? "Verifying..."
                      : "Verify & continue"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => requestCode.mutate({ email })}
                    disabled={requestCode.isPending}
                  >
                    Resend code
                  </Button>
                  {devCode && (
                    <p className="text-xs text-muted-foreground">
                      Dev code: <span className="font-mono">{devCode}</span>
                    </p>
                  )}
                </form>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Lock className="h-4 w-4" />
                <span>Secure checkout powered by Stripe</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                We never store your card details.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
