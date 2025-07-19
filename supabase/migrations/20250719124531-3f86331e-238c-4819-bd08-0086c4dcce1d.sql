-- Create storage buckets for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);

-- Create chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.chat_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.chat_conversations
FOR UPDATE
USING (auth.uid() = user_id);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.chat_messages
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- Create typing indicators table
CREATE TABLE public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Create policies for typing indicators
CREATE POLICY "Users can view typing indicators in their conversations"
ON public.typing_indicators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their typing indicators"
ON public.typing_indicators
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_typing_indicators_updated_at
BEFORE UPDATE ON public.typing_indicators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage policies for chat files
CREATE POLICY "Users can view chat files in their conversations"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-files' AND
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE user_id = auth.uid() AND 
    id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Users can upload chat files to their conversations"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files' AND
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE user_id = auth.uid() AND 
    id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Users can update chat files in their conversations"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-files' AND
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE user_id = auth.uid() AND 
    id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Users can delete chat files in their conversations"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-files' AND
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE user_id = auth.uid() AND 
    id::text = split_part(name, '/', 1)
  )
);