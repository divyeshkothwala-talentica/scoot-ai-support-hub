import { Brain, FileText, Package, Phone, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Smart AI Assistant",
    description: "Natural language processing understands your questions and provides instant, accurate answers about your electric scooter."
  },
  {
    icon: Phone,
    title: "Mobile OTP Login",
    description: "Secure and quick access using your mobile number. No passwords to remember, just instant verification."
  },
  {
    icon: FileText,
    title: "File Upload Support", 
    description: "Upload photos or documents directly in chat to get visual troubleshooting help from our AI assistant."
  },
  {
    icon: Package,
    title: "Real-time Order Tracking",
    description: "Get instant updates on your scooter delivery status, shipping location, and estimated arrival time."
  },
  {
    icon: Zap,
    title: "Auto-Escalation",
    description: "If AI can't resolve your issue, it automatically escalates to human experts who receive full chat context."
  },
  {
    icon: Shield,
    title: "Secure Chat History",
    description: "All your conversations are securely saved for future reference and continuity across support sessions."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Why Choose Our
              <span className="bg-gradient-hero bg-clip-text text-transparent"> AI Support</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Experience the future of customer support with AI-first approach, 
              designed specifically for electric scooter owners.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="bg-gradient-card border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-soft group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-ai rounded-lg flex items-center justify-center group-hover:animate-pulse-glow transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">99.8%</div>
              <div className="text-sm text-muted-foreground">Query Resolution</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">&lt;2s</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">AI Availability</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">50k+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};