import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Wrench, HelpCircle, Cog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ScooterModel {
  id: string;
  model_name: string;
  model_code: string;
  max_speed: number;
  range_km: number;
  battery_capacity: string;
  motor_power: string;
  price: number;
}

interface ModelQuestion {
  id: string;
  question: string;
  answer: string;
  question_type: string;
  category: string;
}

interface ModelSpecificQuestionsProps {
  onQuestionSelect: (question: { question: string; answer: string }) => void;
}

const questionTypes = [
  { value: 'specification', label: 'Specs', icon: Zap, color: 'bg-blue-100 text-blue-800' },
  { value: 'troubleshooting', label: 'Troubleshooting', icon: Wrench, color: 'bg-red-100 text-red-800' },
  { value: 'compatibility', label: 'Compatibility', icon: Cog, color: 'bg-green-100 text-green-800' },
  { value: 'general', label: 'General', icon: HelpCircle, color: 'bg-gray-100 text-gray-800' }
];

export const ModelSpecificQuestions = ({ onQuestionSelect }: ModelSpecificQuestionsProps) => {
  const [models, setModels] = useState<ScooterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [questions, setQuestions] = useState<ModelQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (selectedModel) {
      loadModelQuestions(selectedModel);
    }
  }, [selectedModel]);

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
    } finally {
      setIsLoading(false);
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
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading model questions:', error);
    }
  };

  const getQuestionsByType = (type: string) => {
    return questions.filter(q => q.question_type === type);
  };

  const selectedModelData = models.find(m => m.id === selectedModel);

  if (isLoading) {
    return (
      <Card className="p-4 mb-4 bg-muted/30">
        <div className="space-y-3">
          <div className="h-6 bg-muted animate-pulse rounded"></div>
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 bg-muted animate-pulse rounded w-20"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (models.length === 0) {
    return (
      <Card className="p-4 mb-4 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          No scooter models available
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-4 bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Model-Specific Questions
        </CardTitle>
        
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="h-8">
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
        
        {selectedModelData && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Speed:</strong> {selectedModelData.max_speed} km/h • 
              <strong> Range:</strong> {selectedModelData.range_km} km • 
              <strong> Power:</strong> {selectedModelData.motor_power}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {questions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No questions available for this model
          </p>
        ) : (
          <Tabs defaultValue="specification" className="w-full">
            <TabsList className="grid grid-cols-2 mb-3 h-8">
              {questionTypes.slice(0, 2).map(type => {
                const typeQuestions = getQuestionsByType(type.value);
                return (
                  <TabsTrigger 
                    key={type.value} 
                    value={type.value}
                    className="text-xs py-1"
                    disabled={typeQuestions.length === 0}
                  >
                    <type.icon className="h-3 w-3 mr-1" />
                    {type.label}
                    {typeQuestions.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs h-3 px-1 leading-none">
                        {typeQuestions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            <TabsList className="grid grid-cols-2 mb-3 h-8">
              {questionTypes.slice(2).map(type => {
                const typeQuestions = getQuestionsByType(type.value);
                return (
                  <TabsTrigger 
                    key={type.value} 
                    value={type.value}
                    className="text-xs py-1"
                    disabled={typeQuestions.length === 0}
                  >
                    <type.icon className="h-3 w-3 mr-1" />
                    {type.label}
                    {typeQuestions.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs h-3 px-1 leading-none">
                        {typeQuestions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {questionTypes.map(type => {
              const typeQuestions = getQuestionsByType(type.value);
              
              return (
                <TabsContent key={type.value} value={type.value} className="mt-0">
                  <div className="space-y-2">
                    {typeQuestions.map(question => (
                      <Button
                        key={question.id}
                        variant="outline"
                        size="sm"
                        onClick={() => onQuestionSelect({
                          question: question.question,
                          answer: question.answer
                        })}
                        className="text-xs h-auto p-2 text-left whitespace-normal justify-start"
                      >
                        {question.question}
                      </Button>
                    ))}
                    
                    {typeQuestions.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No {type.label.toLowerCase()} questions available for this model
                      </p>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};