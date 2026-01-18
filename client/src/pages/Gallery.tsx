import { useState } from "react";
import { Link } from "wouter";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

type Category = "all" | "cakes" | "cookies";

interface GalleryImage {
  src: string;
  alt: string;
  category: "cakes" | "cookies";
}

const galleryImages: GalleryImage[] = [
  // Custom Cakes
  { src: "/images/gallery/cake-happily-ever-after-wedding.jpeg", alt: "Happily Ever After Wedding Cake", category: "cakes" },
  { src: "/images/gallery/cake-ufc-boxing-birthday.jpeg", alt: "UFC Boxing Birthday Cake - Michael", category: "cakes" },
  { src: "/images/gallery/cake-mickey-clubhouse-birthday.jpeg", alt: "Mickey Mouse Clubhouse Birthday - Cooper", category: "cakes" },
  { src: "/images/gallery/cake-frozen-elsa-birthday.jpeg", alt: "Frozen Elsa Birthday Cake - Addison", category: "cakes" },
  { src: "/images/gallery/cake-elegant-blue-two-tier.jpeg", alt: "Elegant Blue Two-Tier Cake", category: "cakes" },
  { src: "/images/gallery/cake-minnie-pink-rosettes.jpeg", alt: "Minnie Mouse Pink Rosettes Cake", category: "cakes" },
  { src: "/images/gallery/cake-pink-heart-birthday.jpeg", alt: "Pink Heart 12th Birthday Cake", category: "cakes" },
  { src: "/images/gallery/cake-spidey-twins-birthday.jpeg", alt: "Spidey & Friends Twin Birthday - Miles & Selah", category: "cakes" },
  { src: "/images/gallery/cake-cinnamoroll-sanrio.jpeg", alt: "Cinnamoroll Sanrio Birthday - Auden", category: "cakes" },
  { src: "/images/gallery/cake-golden-oreo.jpeg", alt: "Giant Golden Oreo Cake", category: "cakes" },
  { src: "/images/gallery/cake-kansas-city-chiefs-oliver.jpeg", alt: "Kansas City Chiefs Birthday - Oliver", category: "cakes" },
  { src: "/images/gallery/cake-graduation-julian-wku.jpeg", alt: "Graduation Cake - Julian Hawks to WKU Hilltoppers", category: "cakes" },
  { src: "/images/gallery/cake-demon-slayer-abby.jpeg", alt: "Demon Slayer Anime Birthday - Abby", category: "cakes" },
  { src: "/images/gallery/cake-taco-bell.jpeg", alt: "Taco Bell Birthday Cake", category: "cakes" },
  { src: "/images/gallery/cake-royal-crown-gold.jpeg", alt: "Royal Crown Gold Birthday Cake", category: "cakes" },
  { src: "/images/gallery/cake-minnie-polka-dot-luna.png", alt: "Minnie Mouse Pink Polka Dot - Luna 4th Birthday", category: "cakes" },
  
  // Sugar Cookies
  { src: "/images/gallery/sugar-cookies-housewarming.jpeg", alt: "Housewarming Welcome Home Cookies", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-70th-birthday.jpeg", alt: "70th Birthday Linda - Pink Roses", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-mickey-rainbow.jpeg", alt: "Mickey Minnie Rainbow Cookies", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-watermelon.jpeg", alt: "One in a Melon Watermelon Cookies", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-harry-potter-graduation.jpeg", alt: "Harry Potter Graduation Cookies", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-baseball-team.jpeg", alt: "Baseball Team Cookies", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-pink-dinosaur.jpeg", alt: "Pink Dinosaur Ava 3rd Birthday", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-nurse-medical.jpeg", alt: "Nurse Medical Themed Cookies", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-christmas-santa-baby.jpeg", alt: "Christmas Santa Baby Cookies", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-wedding-bridal.jpeg", alt: "Wedding Bridal Soon to be Mrs Cookies", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-baby-girl-caroline.jpeg", alt: "Baby Girl Caroline 1st Birthday", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-tennessee-soccer.jpeg", alt: "Tennessee United Soccer Club Cookies", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-unc-graduation.jpeg", alt: "UNC Tar Heels Graduation Julia", category: "cookies" },
  { src: "/images/gallery/sugar-cookies-wedding-kelsea-tommy.jpeg", alt: "Wedding Kelsea and Tommy Cookies", category: "cookies" },
];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const filteredImages = selectedCategory === "all" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  const cakeCount = galleryImages.filter(img => img.category === "cakes").length;
  const cookieCount = galleryImages.filter(img => img.category === "cookies").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-purple-100/50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Our <span className="text-pink-500">Gallery</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Browse our collection of custom cakes and decorated sugar cookies. 
              Each creation is handcrafted with love in Castalian Springs, TN.
            </p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-pink-500 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-pink-100 shadow"
                }`}
              >
                All ({galleryImages.length})
              </button>
              <button
                onClick={() => setSelectedCategory("cakes")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === "cakes"
                    ? "bg-pink-500 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-pink-100 shadow"
                }`}
              >
                🎂 Custom Cakes ({cakeCount})
              </button>
              <button
                onClick={() => setSelectedCategory("cookies")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === "cookies"
                    ? "bg-pink-500 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-pink-100 shadow"
                }`}
              >
                🍪 Sugar Cookies ({cookieCount})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium line-clamp-2">
                      {image.alt}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white">
                      {image.category === "cakes" ? "🎂 Cake" : "🍪 Cookies"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-purple-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Order Your Custom Creation?
          </h2>
          <p className="text-pink-100 text-lg mb-8 max-w-2xl mx-auto">
            Every cake and cookie set is made to order with your unique vision in mind. 
            Contact us to discuss your next celebration!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <button className="px-8 py-4 bg-white text-pink-500 font-bold rounded-full hover:bg-pink-50 transition-colors shadow-lg">
                Contact Us
              </button>
            </Link>
            <Link href="/products">
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors">
                View Products
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white text-4xl hover:text-pink-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
          <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <p className="text-white text-lg font-medium">{selectedImage.alt}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-pink-500 rounded-full text-sm text-white">
                {selectedImage.category === "cakes" ? "🎂 Custom Cake" : "🍪 Sugar Cookies"}
              </span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
