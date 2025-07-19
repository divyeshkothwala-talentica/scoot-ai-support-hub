-- Add unique constraint to prevent duplicate feedback for the same message from the same user
ALTER TABLE public.chat_feedback 
ADD CONSTRAINT chat_feedback_message_user_unique 
UNIQUE (message_id, user_id);