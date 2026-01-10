import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toast } from "sonner";
import { 
  Camera, Upload, Heart, Clock, Star, ArrowLeft, Check, 
  AlertCircle, Image, X, Plus, Minus, ShoppingCart, Info,
  Sparkles, Calendar
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getLoginUrl } from "@/const";

export default function CustomPortraitPucks() {
  const { user, isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(6); // Minimum 6 pucks
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: product } = trpc.valentines.customPortrait.useQuery();
  const addToCart = trpc.cart.add.useMutation();
  const utils = trpc.useUtils();

  const minQuantity = 6;
  const maxQuantity = 24;
  const pricePerPuck = product ? parseFloat(product.basePrice) : 8;
  
  const subtotal = quantity * pricePerPuck;
  const deposit = subtotal * 0.5;
  
  // Check availability
  const remaining = product?.inventoryCap ? product.inventoryCap - (product.inventorySold || 0) : 10;
  const isAvailable = remaining > 0;
  
  // Check cutoff date (Feb 10, 2026)
  const cutoffDate = new Date("2026-02-10T23:59:59");
  const now = new Date();
  const isPastCutoff = now > cutoffDate;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }

    // Validate file size (minimum 1MB)
    if (file.size < 1024 * 1024) {
      toast.error("Photo must be at least 1MB for high resolution quality");
      return;
    }

    // Validate file size (maximum 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    toast.success("Photo uploaded successfully!");
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!uploadedFile) {
      toast.error("Please upload a photo for your portrait pucks");
      return;
    }

    if (!product) {
      toast.error("Product not available");
      return;
    }

    try {
      // Note: In production, we would upload the file to S3 first
      // For now, we'll add to cart with a note about the photo
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: quantity,
        customizationNotes: `Custom Portrait Pucks - Photo: ${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB). Instructions: ${specialInstructions || 'None'}`,
      });

      utils.cart.get.invalidate();
      toast.success("Custom Portrait Pucks added to cart! 50% deposit will be charged at checkout.");
      
      // Reset form
      setQuantity(6);
      removeFile();
      setSpecialInstructions("");
    } catch (error) {
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-rainbow-soft py-12">
        <div className="container">
          <Link href="/valentines" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Valentine's Collection
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-pastel flex items-center justify-center">
              <Camera className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Custom Portrait Pucks</h1>
              <p className="text-muted-foreground">Transform your memories into edible art</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white text-purple-600 border-purple-200">
              <Sparkles className="w-4 h-4 mr-2" />
              Projection Technology
            </Badge>
            <Badge className="bg-white text-pink-600 border-pink-200">
              <Heart className="w-4 h-4 mr-2" />
              Hand-Traced Artistry
            </Badge>
            <Badge className="bg-white text-orange-600 border-orange-200">
              <Clock className="w-4 h-4 mr-2" />
              72-Hour Lead Time
            </Badge>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Alerts */}
        {isPastCutoff && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Order Cutoff Passed</AlertTitle>
            <AlertDescription>
              Custom portrait orders for Valentine's Day 2026 are no longer available. 
              The cutoff was February 10, 2026.
            </AlertDescription>
          </Alert>
        )}
        
        {!isAvailable && !isPastCutoff && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sold Out</AlertTitle>
            <AlertDescription>
              All custom portrait slots for Valentine's Day 2026 have been filled. 
              Check back for future availability!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Product Info & Photo Upload */}
          <div className="space-y-6">
            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Our exclusive projection technology process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-pastel-pink flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-pink-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Upload Your Photo</h4>
                    <p className="text-sm text-muted-foreground">
                      Submit a high-resolution photo (minimum 1MB, JPG or PNG). Clear faces and good lighting work best.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-pastel-lavender flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-purple-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">We Project & Trace</h4>
                    <p className="text-sm text-muted-foreground">
                      Your photo is projected onto Oreo pucks, and our artists hand-trace every detail with precision.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-pastel-mint flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-green-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Delivered with Love</h4>
                    <p className="text-sm text-muted-foreground">
                      Your custom portrait pucks are carefully packaged and delivered on your scheduled date.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload */}
            <Card className="border-2 border-dashed border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Your Photo
                </CardTitle>
                <CardDescription>
                  High-resolution photo required (minimum 1MB, JPG or PNG)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!uploadedFile ? (
                  <div 
                    className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-2">Click to upload your photo</p>
                    <p className="text-sm text-muted-foreground">
                      JPG or PNG, minimum 1MB, maximum 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={previewUrl || ''} 
                      alt="Preview" 
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      <span>{uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)}MB)</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photo Tips */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Photo Tips for Best Results
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use photos with clear, well-lit faces</li>
                  <li>• Avoid blurry or low-resolution images</li>
                  <li>• Simple backgrounds work best</li>
                  <li>• High contrast photos translate better to Oreo art</li>
                  <li>• We'll contact you if your photo needs adjustment</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Configuration */}
          <div className="space-y-6">
            <Card className="shadow-pastel">
              <CardHeader className="bg-gradient-rainbow-soft rounded-t-lg">
                <CardTitle>Configure Your Order</CardTitle>
                <CardDescription>Minimum 6 pucks required</CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Quantity Selector */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Number of Pucks</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                      disabled={quantity <= minQuantity}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || minQuantity;
                          setQuantity(Math.min(maxQuantity, Math.max(minQuantity, val)));
                        }}
                        min={minQuantity}
                        max={maxQuantity}
                        className="text-center text-xl font-bold"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    ${pricePerPuck.toFixed(2)} per puck × {quantity} pucks
                  </p>
                </div>

                {/* Special Instructions */}
                <div>
                  <Label htmlFor="instructions" className="text-base font-semibold mb-3 block">
                    Special Instructions (Optional)
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="Any specific requests for your portrait pucks..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                  />
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal ({quantity} pucks)</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-primary">
                    <span className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      50% Deposit Due Today
                    </span>
                    <span className="font-bold">${deposit.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Remaining (charged 24hrs before delivery)</span>
                    <span>${deposit.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                {/* Delivery Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold">Scheduled Delivery Only</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Custom portrait orders require scheduled delivery on February 13 or 14, 2026.
                    You'll select your delivery date and time at checkout.
                  </p>
                </div>

                {/* Add to Cart */}
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!isAvailable || isPastCutoff || !uploadedFile || addToCart.isPending}
                >
                  {addToCart.isPending ? (
                    "Adding..."
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart (${deposit.toFixed(2)} deposit)
                    </>
                  )}
                </Button>

                {/* Availability */}
                {isAvailable && !isPastCutoff && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Only {remaining} order slots remaining
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-700">
                  <AlertCircle className="w-4 h-4" />
                  Important Information
                </h4>
                <ul className="text-sm text-orange-700 space-y-2">
                  <li>• <strong>Order cutoff:</strong> February 10, 2026</li>
                  <li>• <strong>50% deposit</strong> required at booking</li>
                  <li>• Remaining 50% charged 24 hours before delivery</li>
                  <li>• Photo must be submitted within 24 hours of order</li>
                  <li>• We'll contact you if photo quality is insufficient</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
