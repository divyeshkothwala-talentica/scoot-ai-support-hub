import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ThumbsUp, ThumbsDown, Eye, ChevronDown, ChevronUp } from "lucide-react";
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
  { value: 'storage', label: 'Storage' }
];

export const FAQSection = ({ onArticleSelect }: FAQSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<FAQArticle[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, FAQRating>>({});
  const [filteredArticles, setFilteredArticles] = useState<FAQArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFAQArticles();
    if (user) {
      loadUserRatings();
    }
  }, [user]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, selectedCategory]);

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
      </CardContent>
    </Card>
  );
};