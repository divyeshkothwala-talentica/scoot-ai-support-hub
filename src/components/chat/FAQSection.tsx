import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ThumbsUp, ThumbsDown, Eye, ChevronDown, ChevronUp, Zap, Wrench, HelpCircle, Cog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FAQArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
}

interface ScooterModel {
  id: string;
  model_name: string;
  model_code: string;
  max_speed: number;
  range_km: number;
  battery_capacity: string;
  motor_power: string;
  weight_kg: number;
  max_load_kg: number;
  charging_time_hours: number;
  wheel_size: string;
  brake_type: string;
  suspension: string;
  price: number;
}

interface ModelQuestion {
  id: string;
  question: string;
  answer: string;
  question_type: string;
  category: string;
}

interface FAQRating {
  id: string;
  faq_id: string;
  is_helpful: boolean;
}

interface FAQSectionProps {
  onArticleSelect?: (article: FAQArticle) => void;
}

const categories = [
  { value: 'all', label: 'All' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'troubleshooting', label: 'Troubleshooting' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'safety', label: 'Safety' },
  { value: 'storage', label: 'Storage' },
  { value: 'models', label: 'Model Guides' }
];

const questionTypes = [
  { value: 'specification', label: 'Specifications', icon: Zap, color: 'bg-blue-100 text-blue-800' },
  { value: 'troubleshooting', label: 'Troubleshooting', icon: Wrench, color: 'bg-red-100 text-red-800' },
  { value: 'compatibility', label: 'Compatibility', icon: Cog, color: 'bg-green-100 text-green-800' },
  { value: 'general', label: 'General Info', icon: HelpCircle, color: 'bg-gray-100 text-gray-800' }
];

export const FAQSection = ({ onArticleSelect }: FAQSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<FAQArticle[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, FAQRating>>({});
  const [filteredArticles, setFilteredArticles] = useState<FAQArticle[]>([]);
  const [models, setModels] = useState<ScooterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [modelQuestions, setModelQuestions] = useState<ModelQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFAQArticles();
    loadModels();
    if (user) {
      loadUserRatings();
    }
  }, [user]);

  useEffect(() => {
    if (selectedModel) {
      loadModelQuestions(selectedModel);
    }
  }, [selectedModel]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, selectedCategory]);

  const loadModels = async () => {
    try {
      const { data, error } = await supabase
        .from('scooter_models')
        .select('*')
        .eq('is_active', true)
        .order('model_name', { ascending: true });

      if (error) throw error;
      setModels(data || []);
      
      // Auto-select first model if available
      if (data && data.length > 0) {
        setSelectedModel(data[0].id);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadModelQuestions = async (modelId: string) => {
    try {
      const { data, error } = await supabase
        .from('model_specific_questions')
        .select('*')
        .eq('model_id', modelId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setModelQuestions(data || []);
    } catch (error) {
      console.error('Error loading model questions:', error);
    }
  };

  const loadFAQArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_articles')
        .select('*')
        .eq('is_published', true)
        .order('helpful_count', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading FAQ articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserRatings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('faq_ratings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const ratingsMap: Record<string, FAQRating> = {};
      data?.forEach(rating => {
        ratingsMap[rating.faq_id] = rating;
      });
      setUserRatings(ratingsMap);
    } catch (error) {
      console.error('Error loading user ratings:', error);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term) ||
        article.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleArticleView = async (articleId: string) => {
    // Update local state immediately for better UX
    setArticles(prev => prev.map(article => 
      article.id === articleId 
        ? { ...article, view_count: article.view_count + 1 }
        : article
    ));
  };

  const handleRating = async (articleId: string, isHelpful: boolean) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to rate articles",
        variant: "destructive"
      });
      return;
    }

    try {
      const existingRating = userRatings[articleId];
      
      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('faq_ratings')
          .update({ is_helpful: isHelpful })
          .eq('id', existingRating.id);

        if (error) throw error;

        // Update local state
        setUserRatings(prev => ({
          ...prev,
          [articleId]: { ...existingRating, is_helpful: isHelpful }
        }));
      } else {
        // Create new rating
        const { data, error } = await supabase
          .from('faq_ratings')
          .insert({
            faq_id: articleId,
            user_id: user.id,
            is_helpful: isHelpful
          })
          .select()
          .single();

        if (error) throw error;

        setUserRatings(prev => ({
          ...prev,
          [articleId]: data
        }));
      }

      // Refresh articles to get updated counts
      loadFAQArticles();

      toast({
        title: "Thank you!",
        description: "Your feedback has been recorded"
      });
    } catch (error) {
      console.error('Error rating article:', error);
      toast({
        title: "Error",
        description: "Failed to record your rating",
        variant: "destructive"
      });
    }
  };

  const toggleArticleExpansion = (articleId: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
        handleArticleView(articleId);
      }
      return newSet;
    });
  };

  const handleUseInChat = (article: FAQArticle) => {
    onArticleSelect?.(article);
    toast({
      title: "Added to chat",
      description: "FAQ content has been added to your message"
    });
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-muted/30">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="h-6 bg-muted animate-pulse rounded w-3/4"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          FAQ Knowledge Base
        </CardTitle>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-3 h-8">
              {categories.slice(0, 3).map(category => (
                <TabsTrigger 
                  key={category.value} 
                  value={category.value}
                  className="text-xs"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid grid-cols-3 h-8 mt-1">
              {categories.slice(3).map(category => (
                <TabsTrigger 
                  key={category.value} 
                  value={category.value}
                  className="text-xs"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {selectedCategory === 'models' ? (
          // Model-specific questions section
          <div className="space-y-4">
            {models.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No scooter models available
              </p>
            ) : (
              <>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select your scooter model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{model.model_name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            ${model.price}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedModel && (
                  <div className="space-y-3">
                    {/* Model specifications */}
                    <Card className="border border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          {models.find(m => m.id === selectedModel)?.model_name} Specifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {(() => {
                          const model = models.find(m => m.id === selectedModel);
                          if (!model) return null;
                          
                          return (
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <strong>Max Speed:</strong> {model.max_speed} km/h
                              </div>
                              <div>
                                <strong>Range:</strong> {model.range_km} km
                              </div>
                              <div>
                                <strong>Battery:</strong> {model.battery_capacity}
                              </div>
                              <div>
                                <strong>Motor:</strong> {model.motor_power}
                              </div>
                              <div>
                                <strong>Weight:</strong> {model.weight_kg} kg
                              </div>
                              <div>
                                <strong>Max Load:</strong> {model.max_load_kg} kg
                              </div>
                              <div>
                                <strong>Charging:</strong> {model.charging_time_hours} hours
                              </div>
                              <div>
                                <strong>Wheels:</strong> {model.wheel_size}
                              </div>
                              <div>
                                <strong>Brakes:</strong> {model.brake_type}
                              </div>
                              <div>
                                <strong>Suspension:</strong> {model.suspension}
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    {/* Model questions by type */}
                    {questionTypes.map(type => {
                      const typeQuestions = modelQuestions.filter(q => q.question_type === type.value);
                      if (typeQuestions.length === 0) return null;
                      
                      return (
                        <div key={type.value} className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </h4>
                          <div className="space-y-2">
                            {typeQuestions.map(question => (
                              <Collapsible key={question.id}>
                                <Card className="border border-border/50">
                                  <CollapsibleTrigger asChild>
                                    <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
                                      <div className="flex items-start justify-between">
                                        <h5 className="text-sm font-medium text-left">{question.question}</h5>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    </CardHeader>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <CardContent className="pt-0">
                                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                        {question.answer}
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleUseInChat({
                                          id: question.id,
                                          title: question.question,
                                          content: question.answer,
                                          category: 'models',
                                          tags: [type.value],
                                          view_count: 0,
                                          helpful_count: 0,
                                          not_helpful_count: 0
                                        })}
                                        className="h-6 px-3 text-xs"
                                      >
                                        Use in Chat
                                      </Button>
                                    </CardContent>
                                  </CollapsibleContent>
                                </Card>
                              </Collapsible>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Regular FAQ articles
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No FAQ articles found matching your search.
              </p>
            ) : (
              filteredArticles.map(article => {
                const isExpanded = expandedArticles.has(article.id);
                const userRating = userRatings[article.id];
                
                return (
                  <Collapsible key={article.id} open={isExpanded} onOpenChange={() => toggleArticleExpansion(article.id)}>
                    <Card className="border border-border/50">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-left">{article.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {article.category}
                                </Badge>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {article.view_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    {article.helpful_count}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                            {article.content}
                          </p>
                          
                          {article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {article.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Was this helpful?</span>
                              <Button
                                size="sm"
                                variant={userRating?.is_helpful === true ? "default" : "outline"}
                                onClick={() => handleRating(article.id, true)}
                                className="h-6 px-2"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant={userRating?.is_helpful === false ? "destructive" : "outline"}
                                onClick={() => handleRating(article.id, false)}
                                className="h-6 px-2"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleUseInChat(article)}
                              className="h-6 px-3 text-xs"
                            >
                              Use in Chat
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};