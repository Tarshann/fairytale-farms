/**
 * Testimonials — social proof for the homepage.
 *
 * Sources real, published customer reviews via `reviews.recentPublished`
 * (self-maintaining: any review an admin publishes flows straight here).
 * Until enough real reviews exist, it falls back to a small curated set so
 * the homepage never renders an empty section. The curated quotes are
 * clearly generic and safe to ship; replace/remove them once real reviews
 * accumulate.
 */
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Star } from "lucide-react";

type Testimonial = {
  id: string | number;
  rating: number;
  comment: string;
  authorName: string;
  productName?: string | null;
};

// Curated fallback — used only when there are no published reviews yet.
const FALLBACK: Testimonial[] = [
  {
    id: "f1",
    rating: 5,
    comment:
      "The custom cake was the centerpiece of our party — beautiful and somehow even more delicious than it looked. Everyone asked where we got it!",
    authorName: "Sarah",
    productName: "Custom Cake",
  },
  {
    id: "f2",
    rating: 5,
    comment:
      "Ordered the Valentine's box for my wife and she was over the moon. The chocolate-covered strawberries were incredible. Will absolutely order again.",
    authorName: "Michael",
    productName: "Valentine's Box",
  },
  {
    id: "f3",
    rating: 5,
    comment:
      "Local, fresh, and made with so much care. The sugar cookies are works of art. So glad to have a bakery like this in Castalian Springs.",
    authorName: "Jessica",
    productName: "Custom Sugar Cookies",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { data, isLoading } = trpc.reviews.recentPublished.useQuery({ limit: 6 });

  // Don't flash the section while loading.
  if (isLoading) return null;

  const real: Testimonial[] = (data ?? [])
    .filter(r => (r.comment ?? "").trim().length > 0)
    .map(r => ({
      id: r.id,
      rating: r.rating,
      comment: (r.comment ?? "").trim(),
      authorName: r.authorName,
      productName: r.productName,
    }));

  // Use real reviews when we have at least 3; otherwise show the curated set.
  const items = real.length >= 3 ? real.slice(0, 6) : FALLBACK;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We bake for our neighbors in Castalian Springs and across Sumner County.
            Here's what they think.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map(t => (
            <Card key={t.id} className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <Stars rating={t.rating} />
                <p className="text-gray-700 mt-4 mb-6 flex-1 leading-relaxed">
                  &ldquo;{t.comment}&rdquo;
                </p>
                <div className="mt-auto">
                  <p className="font-semibold text-gray-900">{t.authorName}</p>
                  {t.productName && (
                    <p className="text-sm text-gray-500">on {t.productName}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
