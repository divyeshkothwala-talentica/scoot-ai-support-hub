import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Paperclip, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QuickQuestions } from "./QuickQuestions";
import { PredefinedQuestion } from "@/data/predefinedQuestions";

interface ChatMessage {
  id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  user_id: string;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/avi': 'avi'
};

export const ChatInterface = ({ isOpen, onClose }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation when chat opens
  useEffect(() => {
    if (isOpen && user) {
      initializeConversation();
    }
  }, [isOpen, user]);

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!conversationId || !user) return;
    
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator in database
    supabase
      .from('typing_indicators')
      .upsert({ 
        conversation_id: conversationId, 
        user_id: user.id, 
        is_typing: true 
      })
      .then();

    // Clear typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      supabase
        .from('typing_indicators')
        .upsert({ 
          conversation_id: conversationId, 
          user_id: user.id, 
          is_typing: false 
        })
        .then();
    }, 3000);
  };

  const initializeConversation = async () => {
    if (!user) return;

    try {
      // Check if user has existing conversation
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        setConversationId(existing.id);
        loadMessages(existing.id);
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from('chat_conversations')
          .insert({ user_id: user.id, title: 'Support Chat' })
          .select()
          .single();

        if (error) throw error;
        
        setConversationId(newConversation.id);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat",
        variant: "destructive"
      });
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || newMessage.trim();
    if (!content || !conversationId || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          content,
          message_type: 'text'
        });

      if (error) throw error;
      if (!messageContent) setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendAutoReply = async (answer: string) => {
    if (!conversationId || !user) return;

    // Add a small delay to simulate thinking
    setTimeout(async () => {
      try {
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            user_id: 'system', // Use 'system' to indicate auto-reply
            content: answer,
            message_type: 'text'
          });
      } catch (error) {
        console.error('Error sending auto-reply:', error);
      }
    }, 1000);
  };

  const handleQuestionSelect = async (question: PredefinedQuestion) => {
    // Send user's question
    await sendMessage(question.question);
    // Send auto-reply
    await sendAutoReply(question.answer);
  };

  const handleSendClick = () => {
    sendMessage();
  };

  const handleFileUpload = async (file: File) => {
    if (!conversationId || !user) return;

    // Validate file type
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, images (JPG, PNG, GIF), or videos (MP4, AVI)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "File size must be less than 25MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `${conversationId}/${Date.now()}-${file.name}`;
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 100);

      const { data, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(data.path);

      // Save file message to database
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          message_type: 'file',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        });

      if (messageError) throw messageError;

      toast({
        title: "File uploaded",
        description: "File has been successfully uploaded"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const isVideoFile = (fileType: string) => {
    return fileType.startsWith('video/');
  };

  const renderMessage = (message: ChatMessage) => {
    const isCurrentUser = message.user_id === user?.id;
    const isSystemMessage = message.user_id === 'system';
    
    return (
      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isCurrentUser 
            ? 'bg-primary text-primary-foreground' 
            : isSystemMessage
            ? 'bg-accent text-accent-foreground border border-accent-foreground/20'
            : 'bg-muted text-muted-foreground'
        }`}>
          {message.message_type === 'text' ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <div className="space-y-2">
              {message.file_type && isImageFile(message.file_type) ? (
                <img 
                  src={message.file_url!} 
                  alt={message.file_name!}
                  className="max-w-full h-auto rounded"
                />
              ) : message.file_type && isVideoFile(message.file_type) ? (
                <video 
                  src={message.file_url!} 
                  controls 
                  className="max-w-full h-auto rounded"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2 bg-background/10 rounded">
                  <Paperclip className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">{message.file_name}</p>
                    {message.file_size && (
                      <p className="text-xs opacity-70">{formatFileSize(message.file_size)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="text-xs opacity-70 mt-1">
            {new Date(message.created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Chat Support</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Questions */}
          {messages.length === 0 && (
            <QuickQuestions onQuestionSelect={handleQuestionSelect} />
          )}
          
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation with our support team</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <div className="flex-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTypingStart();
                }}
                placeholder="Type your message..."
                className="min-h-[40px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendClick();
                  }
                }}
              />
            </div>
            
            <div className="flex flex-col space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-10 w-10 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleSendClick}
                disabled={!newMessage.trim() || isLoading}
                size="sm"
                className="h-10 w-10 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept={Object.keys(ALLOWED_FILE_TYPES).join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
                e.target.value = '';
              }
            }}
          />

          {/* File type info */}
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">PDF</Badge>
            <Badge variant="outline" className="text-xs">JPG</Badge>
            <Badge variant="outline" className="text-xs">PNG</Badge>
            <Badge variant="outline" className="text-xs">GIF</Badge>
            <Badge variant="outline" className="text-xs">MP4</Badge>
            <Badge variant="outline" className="text-xs">AVI</Badge>
            <span className="text-xs text-muted-foreground ml-2">Max 25MB</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};