import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminQuestion {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_active: boolean;
  display_order: number;
}

interface QuickQuestionsProps {
  onQuestionSelect: (question: { question: string; answer: string }) => void;
}

const categories = [
  { value: 'delivery', label: 'Delivery', color: 'bg-blue-100 text-blue-800' },
  { value: 'technical', label: 'Technical', color: 'bg-red-100 text-red-800' },
  { value: 'service', label: 'Service', color: 'bg-green-100 text-green-800' },
  { value: 'billing', label: 'Billing', color: 'bg-yellow-100 text-yellow-800' }
];

export const QuickQuestions = ({ onQuestionSelect }: QuickQuestionsProps) => {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_questions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryQuestions = (category: string) => {
    return questions.filter(q => q.category === category);
  };

  if (isLoading) {
    return (
      <Card className="p-4 mb-4 bg-muted/30">
        <div className="flex items-center space-x-2 mb-3">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Quick Questions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded-md w-32"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="p-4 mb-4 bg-muted/30">
        <div className="flex items-center space-x-2 mb-3">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Quick Questions</span>
        </div>
        <p className="text-xs text-muted-foreground">
          No questions available at the moment
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4 bg-muted/30">
      <div className="flex items-center space-x-2 mb-3">
        <MessageCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Quick Questions</span>
      </div>
      
      <Tabs defaultValue="delivery" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-3 h-8">
          {categories.map(category => {
            const categoryQuestions = getCategoryQuestions(category.value);
            return (
              <TabsTrigger 
                key={category.value} 
                value={category.value}
                className="text-xs py-1"
                disabled={categoryQuestions.length === 0}
              >
                {category.label}
                {categoryQuestions.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-3 px-1 leading-none">
                    {categoryQuestions.length}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(category => {
          const categoryQuestions = getCategoryQuestions(category.value);
          
          return (
            <TabsContent key={category.value} value={category.value} className="mt-0">
              <div className="flex flex-wrap gap-2">
                {categoryQuestions.map(question => (
                  <Button
                    key={question.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onQuestionSelect({
                      question: question.question,
                      answer: question.answer
                    })}
                    className="text-xs h-8 px-3"
                  >
                    {question.question}
                  </Button>
                ))}
                
                {categoryQuestions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No questions available in this category
                  </p>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </Card>
  );
};