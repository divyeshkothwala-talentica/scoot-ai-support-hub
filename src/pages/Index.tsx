import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { CTASection } from "@/components/CTASection";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FAQModal } from "@/components/chat/FAQModal";
import { MessageCircle } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {user && (
        <div className="bg-electric-green-50 border-b border-electric-green-200 py-3 px-4">
          <div className="container mx-auto flex justify-between items-center">
            <p className="text-sm text-electric-green-800">
              Welcome back! You're logged in.
            </p>
            <div className="flex items-center gap-3">
              <FAQModal />
              <Button 
                variant="outline" 
                size="sm"
                onClick={signOut}
                className="border-electric-green-300 text-electric-green-700 hover:bg-electric-green-100"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      
      {/* Floating Chat Button */}
      {user && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
      
      {/* Chat Interface */}
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  );
};

export default Index;
