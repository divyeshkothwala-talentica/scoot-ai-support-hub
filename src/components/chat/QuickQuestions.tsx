import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { PREDEFINED_QUESTIONS, QUESTION_CATEGORIES, PredefinedQuestion } from "@/data/predefinedQuestions";

interface QuickQuestionsProps {
  onQuestionSelect: (question: PredefinedQuestion) => void;
}

export const QuickQuestions = ({ onQuestionSelect }: QuickQuestionsProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const getQuestionsByCategory = (category: string) => {
    return PREDEFINED_QUESTIONS.filter(q => q.category === category);
  };

  return (
    <Card className="p-4 mb-4 bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Quick Questions</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Category Selection */}
          <div className="flex flex-wrap gap-2">
            {QUESTION_CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Questions */}
          {selectedCategory ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">{selectedCategory}</p>
              {getQuestionsByCategory(selectedCategory).map((question) => (
                <Button
                  key={question.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuestionSelect(question)}
                  className="w-full text-left h-auto p-2 text-xs leading-relaxed justify-start whitespace-normal"
                >
                  {question.question}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a category above to see available questions
            </p>
          )}
        </div>
      )}
    </Card>
  );
};