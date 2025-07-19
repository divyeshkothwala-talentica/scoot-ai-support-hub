import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MessageFeedbackProps {
  messageId: string;
  onFeedbackSubmitted?: () => void;
}

export const MessageFeedback = ({ messageId, onFeedbackSubmitted }: MessageFeedbackProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showNegativeFeedbackDialog, setShowNegativeFeedbackDialog] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (type: 'positive' | 'negative', comment?: string) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('chat_feedback')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          feedback_type: type,
          feedback_comment: comment || null
        }, {
          onConflict: 'message_id,user_id'
        });

      if (error) throw error;

      setFeedback(type);
      onFeedbackSubmitted?.();

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
              We're sorry this response wasn't helpful. Could you tell us what went wrong or what you were expecting?
            </p>
            
            <Textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Please describe the issue or what you were looking for..."
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
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};