import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Play, 
  Pause, 
  Eye, 
  Cookie, 
  Printer, 
  Sparkles,
  ChevronRight,
  Clock,
  Palette,
  TestTube,
  Flame,
  Heart,
  Video,
  VideoOff
} from "lucide-react";

// Simulated lab status - in production this would come from an API
const LAB_STATUS = {
  isLive: false, // Set to true when streaming
  currentProject: "Custom Cowboy Theme Cutter",
  lastUpdated: "2 hours ago"
};

// This week's builds - in production this would come from admin dashboard
const THIS_WEEKS_BUILDS = [
  {
    id: 1,
    name: "Cowboy Theme Set",
    type: "Cookie Cutter",
    status: "printing",
    emoji: "🤠"
  },
  {
    id: 2,
    name: "Happy Birthday DaeVeon",
    type: "Custom Stamp",
    status: "complete",
    emoji: "🎂"
  },
  {
    id: 3,
    name: "Minnie Mouse Collection",
    type: "Embosser Set",
    status: "designing",
    emoji: "🎀"
  }
];

// Process timeline steps
const PROCESS_STEPS = [
  { icon: Palette, label: "Design", description: "Custom artwork created" },
  { icon: Printer, label: "Print", description: "3D printed with precision" },
  { icon: TestTube, label: "Test", description: "Quality checked" },
  { icon: Flame, label: "Bake", description: "Cookies made fresh" },
  { icon: Heart, label: "Decorate", description: "Hand-decorated with love" }
];

function StatusIndicator({ isLive }: { isLive: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`relative flex h-3 w-3`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-green-400' : 'bg-gray-400'}`}></span>
        <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
      </span>
      <span className={`text-sm font-medium ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
        {isLive ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}

function BuildCard({ build }: { build: typeof THIS_WEEKS_BUILDS[0] }) {
  const statusColors = {
    printing: "bg-pastel-blue text-blue-700",
    complete: "bg-pastel-mint text-green-700",
    designing: "bg-pastel-lavender text-purple-700"
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{build.emoji}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{build.name}</h4>
            <p className="text-sm text-muted-foreground">{build.type}</p>
            <Badge className={`mt-2 text-xs ${statusColors[build.status as keyof typeof statusColors]}`}>
              {build.status === 'printing' && '🖨️ '}
              {build.status === 'complete' && '✓ '}
              {build.status === 'designing' && '✏️ '}
              {build.status.charAt(0).toUpperCase() + build.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessTimeline() {
  return (
    <div className="relative">
      {/* Desktop timeline */}
      <div className="hidden md:flex items-center justify-between">
        {PROCESS_STEPS.map((step, index) => (
          <div key={step.label} className="flex flex-col items-center relative">
            {/* Connector line */}
            {index < PROCESS_STEPS.length - 1 && (
              <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-pastel-pink to-pastel-lavender" />
            )}
            
            {/* Step circle */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-white border-2 border-pastel-pink flex items-center justify-center shadow-sm">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            
            {/* Label */}
            <span className="mt-2 text-sm font-semibold text-foreground">{step.label}</span>
            <span className="text-xs text-muted-foreground text-center max-w-[100px]">{step.description}</span>
          </div>
        ))}
      </div>
      
      {/* Mobile timeline */}
      <div className="md:hidden space-y-4">
        {PROCESS_STEPS.map((step, index) => (
          <div key={step.label} className="flex items-center gap-4">
            <div className="relative">
              {/* Vertical connector */}
              {index < PROCESS_STEPS.length - 1 && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-pastel-pink to-pastel-lavender" />
              )}
              <div className="w-10 h-10 rounded-full bg-white border-2 border-pastel-pink flex items-center justify-center shadow-sm">
                <step.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div>
              <span className="font-semibold text-foreground">{step.label}</span>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Lab() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-pastel-pink/20 via-white to-pastel-lavender/20" />
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          
          <div className="container relative">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-4 bg-pastel-peach/50 text-orange-700 border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Behind the Magic
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                In the Lab with{" "}
                <span className="bg-gradient-to-r from-pastel-pink via-pastel-lavender to-pastel-blue bg-clip-text text-transparent">
                  Fairytale Farms
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Catch today's tools being made for tomorrow's cookies. 
                Watch custom cutters, stamps, and embossers come to life!
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Live View Tile */}
              <Card className="overflow-hidden border-2 hover:border-pastel-pink/50 transition-colors">
                <CardContent className="p-0">
                  {/* Video Area */}
                  <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                    {LAB_STATUS.isLive ? (
                      // Live stream placeholder - replace with actual embed
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Video className="w-16 h-16 text-primary mx-auto mb-4" />
                          <p className="text-muted-foreground">Live stream would appear here</p>
                        </div>
                      </div>
                    ) : (
                      // Offline state with cute message
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pastel-pink/10 to-pastel-lavender/10">
                        <div className="text-center p-8">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center">
                            <VideoOff className="w-10 h-10 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-display font-semibold mb-2">The Lab is Cooling Down</h3>
                          <p className="text-muted-foreground mb-4">Check back soon to see the magic happen!</p>
                          <Badge variant="outline" className="text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            Last active: {LAB_STATUS.lastUpdated}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Status overlay */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                        <StatusIndicator isLive={LAB_STATUS.isLive} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Info bar */}
                  <div className="p-4 bg-white border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">Live View</h3>
                        <p className="text-sm text-muted-foreground">Lab cam shows equipment only</p>
                      </div>
                      <Button 
                        variant={LAB_STATUS.isLive ? "default" : "outline"}
                        disabled={!LAB_STATUS.isLive}
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Watch Live
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* This Week's Builds Tile */}
              <Card className="border-2 hover:border-pastel-lavender/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-display font-semibold">This Week's Builds</h3>
                      <p className="text-sm text-muted-foreground">Custom tools in progress</p>
                    </div>
                    <Badge className="bg-pastel-mint/50 text-green-700 border-0">
                      {THIS_WEEKS_BUILDS.length} Projects
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {THIS_WEEKS_BUILDS.map((build) => (
                      <BuildCard key={build.id} build={build} />
                    ))}
                  </div>
                  
                  {/* Now Printing indicator */}
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-pastel-blue/20 to-pastel-mint/20 border border-pastel-blue/30">
                    <div className="flex items-center gap-2 text-sm">
                      <Printer className="w-4 h-4 text-blue-600 animate-pulse" />
                      <span className="font-medium text-blue-700">Now Printing:</span>
                      <span className="text-blue-600">{LAB_STATUS.currentProject}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Process Timeline Section */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-white to-pastel-pink/10">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                How It Becomes Cookies
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From custom design to delicious decorated cookies — watch the journey unfold
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <ProcessTimeline />
            </div>
          </div>
        </section>

        {/* Lab Notes Section */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-pastel-peach/30 to-white border-pastel-peach/50">
                <CardContent className="p-6 text-center">
                  <span className="text-3xl mb-3 block">🖨️</span>
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-orange-700 mb-2">Now Printing</h4>
                  <p className="text-foreground font-medium">Cowboy Theme Cutter Set</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-pastel-lavender/30 to-white border-pastel-lavender/50">
                <CardContent className="p-6 text-center">
                  <span className="text-3xl mb-3 block">⏭️</span>
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-purple-700 mb-2">Next Up</h4>
                  <p className="text-foreground font-medium">Birthday Balloon Embosser</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-pastel-mint/30 to-white border-pastel-mint/50">
                <CardContent className="p-6 text-center">
                  <span className="text-3xl mb-3 block">🍪</span>
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-green-700 mb-2">Bake Pairing</h4>
                  <p className="text-foreground font-medium">Vanilla bean + raspberry royal icing</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-pastel-pink/30 via-pastel-lavender/30 to-pastel-blue/30">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto">
              <Cookie className="w-12 h-12 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Want a Custom Theme?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We can create custom cutters, stamps, and embossers for your special occasion. 
                Your design, your cookies, your story!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products?category=customized-sugar-cookies">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Cookie className="w-5 h-5 mr-2" />
                    Order Custom Cookies
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Ask About Custom Tools
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
