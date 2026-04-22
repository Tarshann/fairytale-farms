import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl prose prose-stone">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: April 2025</p>

          <p>
            Welcome to Fairytale Farms. By placing an order or using our
            website, you agree to the following terms. Please read them
            carefully.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Orders and Payment</h2>
          <p>
            All orders are subject to availability and confirmation. Prices are
            listed in US dollars. Payment is collected in full at the time of
            checkout via Stripe. For custom orders over a certain value, a 50%
            deposit may be required, with the remaining balance due at pickup.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Pickup Policy</h2>
          <p>
            All orders are porch-pickup from our home bakery in Castalian
            Springs, TN. We will contact you via email or phone when your order
            is ready. Pickup times are coordinated directly with you. We are not
            responsible for orders not picked up within 24 hours of the agreed
            pickup time.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Cancellations and Modifications</h2>
          <p>
            Cancellations or modifications must be requested at least{" "}
            <strong>48 hours before your scheduled pickup date</strong>. Custom
            orders that have already entered production are non-refundable.
            Standard orders cancelled with sufficient notice will receive a full
            refund.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Refund Policy</h2>
          <p>
            We stand behind the quality of every item we bake. If there is a
            quality issue with your order, please contact us within{" "}
            <strong>24 hours of pickup</strong> with a photo of the issue. We
            will offer a replacement or store credit at our discretion. We do
            not offer refunds for change-of-mind purchases or orders that have
            been consumed.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Allergen Disclaimer</h2>
          <p>
            Our products are made in a home kitchen that handles{" "}
            <strong>
              wheat, eggs, dairy, tree nuts, and peanuts
            </strong>
            . We cannot guarantee that any product is free from allergens. If
            you have a severe food allergy, please contact us before ordering.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Intellectual Property</h2>
          <p>
            All content on this website, including photos, logos, and product
            descriptions, is the property of Fairytale Farms and may not be
            reproduced without written permission.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Limitation of Liability</h2>
          <p>
            Fairytale Farms' liability is limited to the value of the order
            placed. We are not liable for indirect, incidental, or consequential
            damages arising from the use of our products or services.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Governing Law</h2>
          <p>
            These terms are governed by the laws of the State of Tennessee.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">Contact Us</h2>
          <p>
            Questions about these terms? Email us at{" "}
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
