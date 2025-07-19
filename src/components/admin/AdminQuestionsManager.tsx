import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AdminQuestion {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const categories = [
  { value: 'delivery', label: 'Delivery', color: 'bg-blue-100 text-blue-800' },
  { value: 'technical', label: 'Technical Issues', color: 'bg-red-100 text-red-800' },
  { value: 'service', label: 'Service Support', color: 'bg-green-100 text-green-800' },
  { value: 'billing', label: 'Billing', color: 'bg-yellow-100 text-yellow-800' }
];

export const AdminQuestionsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
    display_order: 0
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_questions')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!formData.category || !formData.question || !formData.answer) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('admin_questions')
          .update({
            category: formData.category,
            question: formData.question,
            answer: formData.answer,
            display_order: formData.display_order
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;

        toast({
          title: "Question Updated",
          description: "The question has been successfully updated"
        });
      } else {
        // Create new question
        const { error } = await supabase
          .from('admin_questions')
          .insert({
            category: formData.category,
            question: formData.question,
            answer: formData.answer,
            display_order: formData.display_order,
            created_by: user?.id
          });

        if (error) throw error;

        toast({
          title: "Question Added",
          description: "The new question has been successfully added"
        });
      }

      setIsDialogOpen(false);
      setEditingQuestion(null);
      setFormData({ category: '', question: '', answer: '', display_order: 0 });
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive"
      });
    }
  };

  const handleEditQuestion = (question: AdminQuestion) => {
    setEditingQuestion(question);
    setFormData({
      category: question.category,
      question: question.question,
      answer: question.answer,
      display_order: question.display_order
    });
    setIsDialogOpen(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('admin_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Question Deleted",
        description: "The question has been successfully deleted"
      });

      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (questionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_questions')
        .update({ is_active: isActive })
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: isActive ? "Question Activated" : "Question Deactivated",
        description: `The question is now ${isActive ? 'visible' : 'hidden'} in chat`
      });

      loadQuestions();
    } catch (error) {
      console.error('Error updating question status:', error);
      toast({
        title: "Error",
        description: "Failed to update question status",
        variant: "destructive"
      });
    }
  };

  const getCategoryQuestions = (category: string) => {
    return questions.filter(q => q.category === category);
  };

  const getCategoryInfo = (category: string) => {
    return categories.find(c => c.value === category);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Questions Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage domain-specific questions that appear in the chat interface
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingQuestion(null);
                setFormData({ category: '', question: '', answer: '', display_order: 0 });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Question *</label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter the question that users will see"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Answer *</label>
                <Textarea
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Enter the auto-reply answer"
                  className="min-h-[120px]"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Display Order</label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveQuestion}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingQuestion ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="delivery" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map(category => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
              <Badge variant="secondary" className="ml-2">
                {getCategoryQuestions(category.value).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.value} value={category.value}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>{category.label} Questions</span>
                  <Badge className={category.color}>
                    {getCategoryQuestions(category.value).filter(q => q.is_active).length} Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getCategoryQuestions(category.value).map(question => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={question.is_active ? "default" : "secondary"}>
                              {question.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Order: {question.display_order}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm mb-2">{question.question}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {question.answer}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Switch
                            checked={question.is_active}
                            onCheckedChange={(checked) => handleToggleActive(question.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getCategoryQuestions(category.value).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No questions in this category yet</p>
                      <p className="text-sm">Add your first question to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};