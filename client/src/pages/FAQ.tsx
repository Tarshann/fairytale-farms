import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ChevronDown, ShoppingBag, Cake, Truck, CreditCard, HelpCircle, MessageCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

function FAQAccordion({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onClick}
        className="w-full py-4 flex items-center justify-between text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-4">{item.question}</span>
        <ChevronDown className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      <div className={cn("overflow-hidden transition-all duration-200", isOpen ? "max-h-96 pb-4" : "max-h-0")}>
        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

function FAQSectionComponent({ section }: { section: FAQSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {section.icon}
        </div>
        <h2 className="text-xl font-bold">{section.title}</h2>
      </div>
      <div>
        {section.items.map((item, index) => (
          <FAQAccordion
            key={index}
            item={item}
            isOpen={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

export default function FAQ() {
  const faqSections: FAQSection[] = [
    {
      title: "Ordering",
      icon: <ShoppingBag className="h-5 w-5" />,
      items: [
        {
          question: "How do I place an order?",
          answer: "You can browse our products and add items to your cart directly on our website. For custom orders like decorated cakes or custom sugar cookies, use our chat feature to discuss your ideas with us. We'll provide a quote and guide you through the ordering process."
        },
        {
          question: "How far in advance should I order?",
          answer: "For ready-to-order items like cookies and brownies, we recommend ordering at least 24-48 hours in advance. For custom cakes and decorated sugar cookies, please allow 5-7 days notice to ensure we can accommodate your design requests."
        },
        {
          question: "Can I modify or cancel my order?",
          answer: "Please contact us as soon as possible if you need to modify or cancel your order. Changes can typically be made up to 48 hours before your pickup date. Custom orders that have already been started may not be eligible for cancellation."
        },
        {
          question: "Do you take last-minute orders?",
          answer: "We try our best to accommodate last-minute requests! Contact us through our chat feature or email, and we'll let you know what's available. Ready-to-order items are often available with shorter notice than custom designs."
        }
      ]
    },
    {
      title: "Custom Orders",
      icon: <Cake className="h-5 w-5" />,
      items: [
        {
          question: "How do custom cake orders work?",
          answer: "Start by using our chat feature to tell us about your vision - the occasion, theme, colors, and any inspiration photos you have. We'll discuss sizing, flavors, and design details, then provide a quote. Once confirmed, we'll create your custom cake with care and attention to detail."
        },
        {
          question: "What cake sizes and flavors do you offer?",
          answer: "We offer 6-inch cakes (serves 8-10), 8-inch cakes (serves 12-16), and two-tier options. Our flavors include vanilla, chocolate, strawberry, and seasonal specialties. Buttercream frosting is our standard, with fondant available for certain designs."
        },
        {
          question: "Can I send inspiration photos for my custom order?",
          answer: "Absolutely! We encourage you to share inspiration photos through our chat feature. While we create original designs (not exact copies), your photos help us understand your style preferences and create something perfect for your celebration."
        },
        {
          question: "How much do custom cakes cost?",
          answer: "Custom cakes start at $75 for a 6-inch cake and $110 for an 8-inch cake. Two-tier cakes range from $150-$210 depending on size. Final pricing depends on design complexity. We'll always provide a clear quote before you commit."
        },
        {
          question: "Do you make custom sugar cookies?",
          answer: "Yes! Our custom decorated sugar cookies are $55 per dozen. They're perfect for birthdays, baby showers, weddings, holidays, and corporate events. Share your theme and we'll create beautiful, delicious cookies to match."
        }
      ]
    },
    {
      title: "Pickup & Delivery",
      icon: <Truck className="h-5 w-5" />,
      items: [
        {
          question: "Where are you located?",
          answer: "We're based in Gallatin, Tennessee, serving the surrounding communities including Sumner County. We're a home-based bakery, so all orders are fulfilled through scheduled pickup or delivery services."
        },
        {
          question: "How does pickup work?",
          answer: "We offer convenient porch pickup from our location in Gallatin. When your order is ready, we'll contact you with pickup instructions. Your treats will be packaged and ready for you to grab - quick and contactless!"
        },
        {
          question: "Do you deliver?",
          answer: "We partner with DoorDash and Uber Eats for delivery to addresses within our service area. For custom cakes and special orders, we may offer personal delivery for an additional fee - just ask when placing your order."
        },
        {
          question: "What areas do you serve?",
          answer: "We serve Gallatin and surrounding Tennessee communities including Hendersonville, Goodlettsville, Madison, and other areas within Sumner County. Contact us if you're unsure whether we deliver to your location."
        }
      ]
    },
    {
      title: "Payment",
      icon: <CreditCard className="h-5 w-5" />,
      items: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit and debit cards through our secure Stripe payment system. Payment is processed when you complete your order online."
        },
        {
          question: "Do you require a deposit for custom orders?",
          answer: "For larger custom orders, we may require a 50% deposit to secure your order date, with the remaining balance due at pickup. This will be clearly communicated when you receive your quote."
        },
        {
          question: "Will I receive a receipt?",
          answer: "Yes! After your payment is processed, you'll receive an email receipt from Stripe with your order details. Keep this for your records."
        },
        {
          question: "What is your refund policy?",
          answer: "We stand behind the quality of our products. If there's an issue with your order, please contact us immediately and we'll make it right. Custom orders are non-refundable once production has begun."
        }
      ]
    },
    {
      title: "Valentine's Day Boxes",
      icon: <Heart className="h-5 w-5" />,
      items: [
        {
          question: "Why are Valentine's items priced differently than regular menu items?",
          answer: "Valentine's Day is a high-demand holiday that requires additional preparation, specialty packaging, and limited production windows. Pricing reflects the time, materials, and care required to create gift-ready items during this busy season."
        },
        {
          question: "Why do pre-designed boxes cost more than individual items?",
          answer: "Our Valentine's boxes are curated gift experiences, not just individual desserts grouped together. Box pricing includes specialty Valentine's packaging, design consistency, assembly and presentation, and holiday availability. Pre-designed boxes also offer the best overall value."
        },
        {
          question: "Can I build a custom box for less than a pre-designed box?",
          answer: "No. Create Your Own boxes have order minimums to ensure fairness and availability. Pre-designed Valentine's boxes are the best value at each tier."
        },
        {
          question: "Can I substitute items in the Valentine's boxes?",
          answer: "No. All Valentine's boxes are pre-designed and cannot be customized or substituted."
        },
        {
          question: "Why do Create Your Own boxes require advance ordering?",
          answer: "Create Your Own boxes require additional planning and prep time. For this reason, advance orders are required and same-day requests cannot be accommodated."
        },
        {
          question: "Do you offer discounts or promotions on Valentine's boxes?",
          answer: "Valentine's boxes are limited-quantity holiday items and are not eligible for discounts, promotions, or bundle deals."
        },
        {
          question: "Are refunds available for Valentine's orders?",
          answer: "All Valentine's Day orders are final sale due to the custom nature of holiday items."
        },
        {
          question: "Which Valentine's box is the best value?",
          answer: "Our Fairytale Romance Box ($100) offers the most variety and value, followed closely by the Sweetheart Box ($75). The Crush Box ($50) is perfect for smaller gifts or single recipients."
        }
      ]
    },
    {
      title: "Products & Ingredients",
      icon: <HelpCircle className="h-5 w-5" />,
      items: [
        {
          question: "Are your products made from scratch?",
          answer: "Yes! Everything we make is crafted from scratch in small batches using quality ingredients. We never use box mixes or mass-produced components. Each treat is made with love and attention to detail."
        },
        {
          question: "Do you accommodate allergies or dietary restrictions?",
          answer: "Please let us know about any allergies or dietary needs when ordering. While we can accommodate some requests, our kitchen handles common allergens including wheat, dairy, eggs, and nuts. We cannot guarantee a completely allergen-free environment."
        },
        {
          question: "How should I store my baked goods?",
          answer: "Cookies and brownies stay fresh at room temperature for 3-5 days in an airtight container. Cakes should be refrigerated and brought to room temperature 30 minutes before serving for the best taste and texture."
        },
        {
          question: "What makes your freeze-dried candy special?",
          answer: "Our Bickering Bros freeze-dried candy offers a unique, crunchy texture that's completely different from regular candy. The freeze-drying process intensifies flavors while creating an addictively light, airy crunch. It's a fun twist on your favorite treats!"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#f5a9c1]/10 via-[#b19cd9]/10 to-[#a4c4e0]/10 py-12">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Frequently Asked <span className="text-gradient-gold">Questions</span>
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
              Find answers to common questions about ordering, custom designs, pickup, and more.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12">
          <div className="container max-w-4xl">
            <div className="space-y-8">
              {faqSections.map((section, index) => (
                <FAQSectionComponent key={index} section={section} />
              ))}
            </div>
          </div>
        </section>

        {/* Still Have Questions CTA */}
        <section className="py-12 bg-gradient-to-br from-[#f5a9c1]/5 via-[#b19cd9]/5 to-[#a4c4e0]/5">
          <div className="container max-w-2xl text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-border p-8">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Our friendly team is here to help! 
                Use our chat feature for quick answers or send us a message.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </Link>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Start a Chat
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
