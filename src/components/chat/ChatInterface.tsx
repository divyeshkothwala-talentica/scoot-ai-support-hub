import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Paperclip, X, Upload, RotateCcw } from "lucide-react";
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
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageFeedback } from "./MessageFeedback";
import { PredefinedQuestion, PREDEFINED_QUESTIONS } from "@/data/predefinedQuestions";

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

interface MessageFeedback {
  id: string;
  message_id: string;
  feedback_type: 'positive' | 'negative';
  feedback_comment: string | null;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationUpdate?: () => void;
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

export const ChatInterface = ({ isOpen, onClose, onConversationUpdate }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, MessageFeedback>>({});
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
    if (isOpen && user && !conversationId) {
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
        const newMessage = payload.new as ChatMessage;
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
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
      // Check if user has existing conversations
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        setConversationId(existing[0].id);
        loadMessages(existing[0].id);
      } else {
        // Create first conversation
        createNewConversation();
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

  const createNewConversation = async () => {
    if (!user) return;

    try {
      const { data: newConversation, error } = await supabase
        .from('chat_conversations')
        .insert({ 
          user_id: user.id, 
          title: 'New Chat'
        })
        .select()
        .single();

      if (error) throw error;
      
      setConversationId(newConversation.id);
      setMessages([]); // Clear messages for new conversation
      
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      });
    }
  };

  const handleConversationSelect = (convId: string) => {
    if (convId !== conversationId) {
      setConversationId(convId);
      loadMessages(convId);
    }
  };

  const [refreshSidebar, setRefreshSidebar] = useState(0);

  const handleNewConversation = () => {
    // Conversation is already created in the sidebar, just clear messages
    setMessages([]);
  };

  const triggerSidebarRefresh = () => {
    setRefreshSidebar(prev => prev + 1);
    onConversationUpdate?.();
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
      
      // Load feedback for all messages
      if (data && data.length > 0) {
        loadMessageFeedback(data.map(msg => msg.id));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadMessageFeedback = async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('chat_feedback')
        .select('*')
        .in('message_id', messageIds)
        .eq('user_id', user.id);

      if (error) throw error;

      // Convert array to object for easy lookup
      const feedbackMap: Record<string, MessageFeedback> = {};
      data?.forEach(feedback => {
        feedbackMap[feedback.message_id] = {
          id: feedback.id,
          message_id: feedback.message_id,
          feedback_type: feedback.feedback_type as 'positive' | 'negative',
          feedback_comment: feedback.feedback_comment
        };
      });

      setMessageFeedback(feedbackMap);
    } catch (error) {
      console.error('Error loading message feedback:', error);
    }
  };

  const handleFeedbackUpdate = (messageId: string, feedback: MessageFeedback | null) => {
    if (feedback) {
      setMessageFeedback(prev => ({
        ...prev,
        [messageId]: feedback
      }));
    } else {
      setMessageFeedback(prev => {
        const newFeedback = { ...prev };
        delete newFeedback[messageId];
        return newFeedback;
      });
    }
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || newMessage.trim();
    if (!content || !conversationId || !user) return;

    console.log('Sending message:', content);
    setIsLoading(true);
    try {
      // Send user message
      const { data: userMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          content,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add user message to state immediately
      setMessages(prev => [...prev, userMessage]);
      
      // Trigger sidebar refresh to update first message display
      triggerSidebarRefresh();
      
      if (!messageContent) setNewMessage("");

      // Check for auto-reply
      const matchingQuestion = PREDEFINED_QUESTIONS.find(q => 
        q.question.toLowerCase().trim() === content.toLowerCase().trim()
      );
      
      console.log('Matching question found:', matchingQuestion);
      console.log('All predefined questions:', PREDEFINED_QUESTIONS.map(q => q.question));
      
      // Send auto-reply after a short delay
      setTimeout(async () => {
        const replyContent = matchingQuestion 
          ? matchingQuestion.answer 
          : "Thank you for your message! Our support team will get back to you shortly. For immediate assistance, please use one of the quick questions above or call our support hotline.";
        
        console.log('Sending auto-reply:', replyContent);
        
        try {
          const { data: autoReply, error: replyError } = await supabase
            .from('chat_messages')
            .insert({
              conversation_id: conversationId,
              user_id: user.id, // Changed from 'system' to user.id to avoid RLS issues
              content: `[Auto-Reply] ${replyContent}`,
              message_type: 'text'
            })
            .select()
            .single();

          console.log('Auto-reply result:', { autoReply, replyError });

          if (!replyError && autoReply) {
            setMessages(prev => [...prev, autoReply]);
          }
        } catch (replyError) {
          console.error('Error sending auto-reply:', replyError);
        }
      }, 1000);

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

  const handleQuestionSelect = (question: PredefinedQuestion) => {
    // Populate the textarea with the selected question
    setNewMessage(question.question);
  };

  const clearChat = async () => {
    if (!conversationId || !user) return;

    try {
      // Delete all messages in the current conversation
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id); // Added user_id filter for additional security

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      // Clear messages from state immediately
      setMessages([]);
      
      console.log('Chat cleared successfully');
      
      toast({
        title: "Chat cleared",
        description: "All messages have been deleted successfully"
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat. Please try again.",
        variant: "destructive"
      });
    }
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
      const { data: fileMessage, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          message_type: 'file',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Add file message to state immediately for instant visibility
      setMessages(prev => [...prev, fileMessage]);

      // Trigger sidebar refresh
      triggerSidebarRefresh();

      toast({
        title: "File uploaded",
        description: "File has been successfully uploaded"
      });

      // Generate auto-response for file upload
      setTimeout(async () => {
        const fileTypeCategory = file.type.startsWith('image/') ? 'image' :
                               file.type.startsWith('video/') ? 'video' :
                               file.type === 'application/pdf' ? 'document' : 'file';
        
        const autoReplyContent = `Thank you for uploading your ${fileTypeCategory}! I've received "${file.name}" successfully. Our support team will review it and get back to you shortly. If you have any questions about this ${fileTypeCategory}, feel free to ask!`;
        
        try {
          const { data: autoReply, error: replyError } = await supabase
            .from('chat_messages')
            .insert({
              conversation_id: conversationId,
              user_id: user.id,
              content: `[Auto-Reply] ${autoReplyContent}`,
              message_type: 'text'
            })
            .select()
            .single();

          if (!replyError && autoReply) {
            setMessages(prev => [...prev, autoReply]);
          }
        } catch (replyError) {
          console.error('Error sending file upload auto-reply:', replyError);
        }
      }, 1000);

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
    const isCurrentUser = message.user_id === user?.id && !message.content?.startsWith('[Auto-Reply]');
    const isAutoReply = message.content?.startsWith('[Auto-Reply]');
    
    return (
      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isCurrentUser 
            ? 'bg-primary text-primary-foreground' 
            : isAutoReply
            ? 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
            : 'bg-muted text-muted-foreground'
        }`}>
          {isAutoReply && (
            <div className="flex items-center space-x-1 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Support Bot</span>
            </div>
          )}
          {message.message_type === 'text' ? (
            <p className="text-sm">
              {isAutoReply ? message.content?.replace('[Auto-Reply] ', '') : message.content}
            </p>
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
          
          {/* Show feedback buttons only for auto-replies */}
          {isAutoReply && (
            <MessageFeedback 
              messageId={message.id}
              existingFeedback={messageFeedback[message.id]}
              onFeedbackSubmitted={(feedback) => {
                handleFeedbackUpdate(message.id, feedback);
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[700px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Chat Support</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearChat}
                title="Clear current chat"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Main Chat Area with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation Sidebar */}
          <ConversationSidebar
            key={refreshSidebar} // Force refresh when new messages are sent
            selectedConversationId={conversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />

          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col">

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Quick Questions - Always show at top */}
              <QuickQuestions onQuestionSelect={handleQuestionSelect} />
              
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation with our support team</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(renderMessage)}
                </div>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};