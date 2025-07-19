import { useState } from "react";
import { MessageCircle, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChatInterface } from "@/components/chat/ChatInterface";
import scooterHero from "@/assets/scooter-hero.jpg";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleStartChat = () => {
    if (user) {
      setIsChatOpen(true);
    } else {
      navigate("/auth");
    }
  };

  const handleTrackOrder = () => {
    if (user) {
      setIsChatOpen(true);
    } else {
      navigate("/auth");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted to-accent/10">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-ai opacity-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left space-y-8 animate-slide-up">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    AI-Powered
                  </span>
                  <br />
                  <span className="text-foreground">
                    Scooter Support
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                  Get instant help for your electric scooter with our smart AI assistant. 
                  Track orders, troubleshoot issues, and get expert support 24/7.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-ai border border-primary/10">
                  <MessageCircle className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Smart Chat</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-ai border border-primary/10">
                  <Smartphone className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Mobile First</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-ai border border-primary/10">
                  <Zap className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Instant Help</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  variant="hero" 
                  size="lg"
                  className="text-lg animate-pulse-glow"
                  onClick={handleStartChat}
                >
                  {user ? "Start Chat Support" : "Start Free Chat"}
                  <MessageCircle className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ai" 
                  size="lg"
                  className="text-lg"
                  onClick={handleTrackOrder}
                >
                  {user ? "Track My Order" : "Login to Track Orders"}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                ✨ <strong>New:</strong> AI-powered instant responses • File upload support • Order tracking
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative lg:block">
              <div className="relative animate-float">
                <img 
                  src={scooterHero} 
                  alt="Electric Scooter Support" 
                  className="w-full max-w-lg mx-auto rounded-2xl shadow-glow"
                />
                <div className="absolute inset-0 bg-gradient-hero opacity-10 rounded-2xl" />
              </div>
              
              {/* Floating UI Elements */}
              <div className="absolute -top-4 -right-4 bg-background p-4 rounded-xl shadow-soft border animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                  <span className="text-sm font-medium">AI Online</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-background p-4 rounded-xl shadow-soft border animate-slide-up" style={{ animationDelay: '1s' }}>
                <div className="text-sm">
                  <div className="font-medium">Response Time</div>
                  <div className="text-primary font-bold">&lt; 2 seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Interface */}
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </section>
  );
};