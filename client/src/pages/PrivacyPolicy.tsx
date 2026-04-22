import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl prose prose-stone">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: April 2025</p>

          <p>
            Fairytale Farms ("we," "us," or "our") operates the website{" "}
            <a href="https://fairytalefarms.net">fairytalefarms.net</a>. This
            Privacy Policy explains how we collect, use, and protect your
            personal information when you visit our site or place an order.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Information We Collect</h2>
          <p>
            We collect information you provide directly to us, including your
            name, email address, phone number, and any customization details you
            share when placing an order. Payment information is processed
            securely by Stripe and is never stored on our servers.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">How We Use Your Information</h2>
          <p>
            We use your information solely to fulfill your orders, communicate
            with you about your order status, and — with your consent — send you
            occasional updates about new products and seasonal specials. We do
            not sell, rent, or share your personal information with third parties
            for marketing purposes.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Cookies and Analytics</h2>
          <p>
            Our website uses cookies to maintain your session and shopping cart.
            We may use anonymized analytics (e.g., PostHog) to understand how
            visitors use our site. You can disable cookies in your browser
            settings, though some features may not function correctly.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your
            information. All data is transmitted over HTTPS. Payment processing
            is handled by Stripe, which is PCI-DSS compliant.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your
            personal data at any time by contacting us at{" "}
            <a href="mailto:fairytalefarms.net@gmail.com">
              fairytalefarms.net@gmail.com
            </a>
            . We will respond within 30 days.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Children's Privacy</h2>
          <p>
            Our website is not directed to children under 13. We do not
            knowingly collect personal information from children.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes by posting the new policy on this page
            with an updated date.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at{" "}
            <a href="mailto:fairytalefarms.net@gmail.com">
              fairytalefarms.net@gmail.com
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
