import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MessageFeedback {
  id: string;
  message_id: string;
  feedback_type: 'positive' | 'negative';
  feedback_comment: string | null;
}

interface MessageFeedbackProps {
  messageId: string;
  existingFeedback?: MessageFeedback;
  onFeedbackSubmitted?: (feedback: MessageFeedback | null) => void;
}

export const MessageFeedback = ({ messageId, existingFeedback, onFeedbackSubmitted }: MessageFeedbackProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(existingFeedback?.feedback_type || null);
  const [showNegativeFeedbackDialog, setShowNegativeFeedbackDialog] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState(existingFeedback?.feedback_comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local state when existingFeedback changes
  useEffect(() => {
    if (existingFeedback) {
      setFeedback(existingFeedback.feedback_type);
      setFeedbackComment(existingFeedback.feedback_comment || "");
    }
  }, [existingFeedback]);

  const submitFeedback = async (type: 'positive' | 'negative', comment?: string) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('chat_feedback')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          feedback_type: type,
          feedback_comment: comment || null
        }, {
          onConflict: 'message_id,user_id'
        })
        .select()
        .single();

      if (error) throw error;

      setFeedback(type);
      onFeedbackSubmitted?.({
        id: data.id,
        message_id: data.message_id,
        feedback_type: data.feedback_type as 'positive' | 'negative',
        feedback_comment: data.feedback_comment
      });

      toast({
        title: "Feedback submitted",
        description: type === 'positive' 
          ? "Thank you for your positive feedback!" 
          : "Thank you for your feedback. We'll use it to improve our responses."
      });

      if (type === 'negative') {
        setShowNegativeFeedbackDialog(false);
        setFeedbackComment("");
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePositiveFeedback = () => {
    submitFeedback('positive');
  };

  const handleNegativeFeedback = () => {
    if (existingFeedback?.feedback_type === 'negative') {
      // If already negative feedback, show the dialog with existing comment
      setFeedbackComment(existingFeedback.feedback_comment || "");
    }
    setShowNegativeFeedbackDialog(true);
  };

  const handleNegativeFeedbackSubmit = () => {
    submitFeedback('negative', feedbackComment);
  };

  return (
    <>
      <div className="flex items-center space-x-1 mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePositiveFeedback}
          disabled={isSubmitting}
          className={`h-6 px-2 ${
            feedback === 'positive' 
              ? 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400' 
              : 'text-muted-foreground hover:text-green-600'
          }`}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNegativeFeedback}
          disabled={isSubmitting}
          className={`h-6 px-2 ${
            feedback === 'negative' 
              ? 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400' 
              : 'text-muted-foreground hover:text-red-600'
          }`}
        >
          <ThumbsDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Negative Feedback Dialog */}
      <Dialog open={showNegativeFeedbackDialog} onOpenChange={setShowNegativeFeedbackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquareMore className="h-5 w-5" />
              <span>Tell us more</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {existingFeedback?.feedback_type === 'negative' 
                ? "Update your feedback or modify your comment below:"
                : "We're sorry this response wasn't helpful. Could you tell us what went wrong or what you were expecting?"
              }
            </p>
            
            <Textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder={existingFeedback?.feedback_type === 'negative' 
                ? "Update your feedback..." 
                : "Please describe the issue or what you were looking for..."
              }
              className="min-h-[100px]"
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowNegativeFeedbackDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNegativeFeedbackSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : existingFeedback?.feedback_type === 'negative' ? "Update Feedback" : "Submit Feedback"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};