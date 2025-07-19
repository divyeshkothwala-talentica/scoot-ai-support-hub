-- Create feedback table for chat messages
CREATE TABLE public.chat_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_feedback
CREATE POLICY "Users can create feedback for messages in their conversations" 
ON public.chat_feedback 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN chat_conversations cc ON cm.conversation_id = cc.id
    WHERE cm.id = chat_feedback.message_id 
    AND cc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view feedback for messages in their conversations" 
ON public.chat_feedback 
FOR SELECT 
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN chat_conversations cc ON cm.conversation_id = cc.id
    WHERE cm.id = chat_feedback.message_id 
    AND cc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own feedback" 
ON public.chat_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_chat_feedback_updated_at
BEFORE UPDATE ON public.chat_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();