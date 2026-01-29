import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, MapPin, Clock, Send } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submitContactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    },
    onError: error => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    submitContactMutation.mutate({ name, email, subject, message });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-[#f5a9c1]/10 via-[#b19cd9]/10 to-[#a4c4e0]/10 py-12">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Get in <span className="text-gradient-gold">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
              Have a question or want to place a custom order? We'd love to hear
              from you!
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-6">
                      Send us a Message
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          rows={6}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={submitContactMutation.isPending}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {submitContactMutation.isPending
                          ? "Sending..."
                          : "Send Message"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-bold">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Email</p>
                          <a
                            href="mailto:fairytalefarms.net@gmail.com"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            fairytalefarms.net@gmail.com
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">
                            Castalian Springs, TN
                            <br />
                            Sumner County
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-bold">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Online Orders
                        </span>
                        <span className="font-medium">24/7</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Custom Orders
                        </span>
                        <span className="font-medium">48-72 hours notice</span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2">
                        We're an online-only bakery serving Sumner County via
                        DoorDash & Uber Eats
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
