import { useState } from "react";
import { MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChatInterface } from "@/components/chat/ChatInterface";

export const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleMobileLogin = () => {
    if (user) {
      // User is already logged in, go to main app
      navigate("/");
    } else {
      // User not logged in, go to auth page
      navigate("/auth");
    }
  };

  const handleStartChat = () => {
    if (user) {
      setIsChatOpen(true);
    } else {
      navigate("/auth");
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary-glow to-accent relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="space-y-8 animate-slide-up">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Experience 
              <br />
              <span className="text-white/90">AI-Powered Support?</span>
            </h2>
            
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Join thousands of electric scooter riders who get instant help, 
              track their orders, and solve problems in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                variant="secondary" 
                size="lg"
                className="text-lg shadow-glow bg-white hover:bg-white/90 text-primary"
                onClick={handleMobileLogin}
              >
                <Smartphone className="w-5 h-5" />
                {user ? "Continue to Support" : "Login with Mobile"}
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={handleStartChat}
              >
                <MessageCircle className="w-5 h-5" />
                {user ? "Start Chat Support" : "Start Free Chat"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-2xl font-bold mb-2">⚡</div>
                <div className="text-sm text-white/80">Instant AI Responses</div>
              </div>
              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="text-2xl font-bold mb-2">🔒</div>
                <div className="text-sm text-white/80">Secure Mobile Login</div>
              </div>
              <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-2xl font-bold mb-2">📱</div>
                <div className="text-sm text-white/80">Mobile-First Design</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </section>
  );
};