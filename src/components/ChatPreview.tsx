import { Bot, User, Package, FileImage } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const chatMessages = [
  {
    type: "user",
    message: "My scooter won't start, and there's a red light blinking",
    time: "2:34 PM"
  },
  {
    type: "ai",
    message: "I can help you troubleshoot that! A blinking red light usually indicates a battery or charging issue. Let me guide you through some quick checks:",
    time: "2:34 PM",
    suggestions: ["Check battery level", "Inspect charging port", "Reset the scooter"]
  },
  {
    type: "user", 
    message: "Here's a photo of the red light",
    time: "2:35 PM",
    hasFile: true
  },
  {
    type: "ai",
    message: "Perfect! I can see the battery indicator. This suggests your battery is critically low. Please connect your charger and wait 10-15 minutes before trying to start.",
    time: "2:35 PM"
  }
];

export const ChatPreview = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Chat Interface */}
            <div className="order-2 lg:order-1">
              <Card className="bg-gradient-card shadow-glow border-primary/10 animate-slide-up">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">AI Support Assistant</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        Online • Responds in seconds
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex gap-3 animate-slide-up`}
                        style={{ animationDelay: `${index * 0.3}s` }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.type === 'ai' 
                            ? 'bg-gradient-hero' 
                            : 'bg-muted'
                        }`}>
                          {msg.type === 'ai' ? (
                            <Bot className="w-4 h-4 text-white" />
                          ) : (
                            <User className="w-4 h-4 text-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className={`p-3 rounded-lg max-w-xs ${
                            msg.type === 'ai'
                              ? 'bg-gradient-ai border border-primary/10'
                              : 'bg-muted text-right ml-auto'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                            {msg.hasFile && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <FileImage className="w-3 h-3" />
                                scooter-light.jpg
                              </div>
                            )}
                          </div>
                          
                          {msg.suggestions && (
                            <div className="flex flex-wrap gap-2">
                              {msg.suggestions.map((suggestion, i) => (
                                <Button 
                                  key={i}
                                  variant="ai" 
                                  size="sm"
                                  className="text-xs"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">{msg.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Input Area */}
                  <div className="border-t border-border/50 p-4">
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                        Type your message...
                      </div>
                      <Button variant="hero" size="sm">
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2 space-y-8 animate-slide-up">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold">
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    Smart Conversations
                  </span>
                  <br />
                  <span className="text-foreground">
                    That Actually Help
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Our AI understands context, remembers your scooter model, and can analyze 
                  photos you upload. Get personalized solutions, not generic responses.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-ai border border-primary/10">
                  <Package className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium mb-1">Instant Order Updates</h4>
                    <p className="text-sm text-muted-foreground">
                      Just ask "Where's my order?" and get real-time tracking information.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-ai border border-primary/10">
                  <FileImage className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium mb-1">Visual Troubleshooting</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload photos of issues and get AI-powered visual diagnosis.
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="hero" size="lg" className="animate-pulse-glow">
                Try the Chat Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};