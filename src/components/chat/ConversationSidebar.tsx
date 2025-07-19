import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  first_message?: string;
}

interface ConversationSidebarProps {
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

export const ConversationSidebar = ({
  selectedConversationId,
  onConversationSelect,
  onNewConversation
}: ConversationSidebarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get first message for each conversation
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conversation) => {
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('content')
            .eq('conversation_id', conversation.id)
            .eq('message_type', 'text')
            .not('content', 'like', '[Auto-Reply]%') // Exclude auto-replies
            .order('created_at', { ascending: true })
            .limit(1);

          return {
            ...conversation,
            first_message: messages?.[0]?.content || null
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: `Chat ${conversations.length + 1}`
        })
        .select()
        .single();

      if (error) throw error;

      // Add new conversation with empty first_message
      const newConversationWithMessage = {
        ...data,
        first_message: null
      };

      setConversations(prev => [newConversationWithMessage, ...prev]);
      onConversationSelect(data.id);
      onNewConversation();
      
      toast({
        title: "New conversation created",
        description: "Ready to start chatting!"
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      // Delete messages first
      await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Then delete the conversation
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If we deleted the selected conversation, create a new one
      if (selectedConversationId === conversationId) {
        if (conversations.length > 1) {
          const remainingConversations = conversations.filter(conv => conv.id !== conversationId);
          onConversationSelect(remainingConversations[0].id);
        } else {
          createNewConversation();
        }
      }

      toast({
        title: "Conversation deleted",
        description: "The conversation and all its messages have been removed"
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  };

  const startEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ title: editTitle.trim() })
        .eq('id', editingId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setConversations(prev => 
        prev.map(conv => 
          conv.id === editingId 
            ? { ...conv, title: editTitle.trim() }
            : conv
        )
      );

      setEditingId(null);
      setEditTitle("");

      toast({
        title: "Title updated",
        description: "Conversation title has been changed"
      });
    } catch (error) {
      console.error('Error updating conversation title:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation title",
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const getDisplayTitle = (conversation: Conversation) => {
    if (conversation.first_message) {
      // Use first message as title, truncated
      return conversation.first_message.length > 40 
        ? `${conversation.first_message.substring(0, 40)}...`
        : conversation.first_message;
    }
    // Fallback to original title if no first message
    return conversation.title;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-full md:w-80 border-r bg-background/95 backdrop-blur-sm flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="p-3 md:p-4 border-b bg-background md:bg-transparent">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center space-x-2 text-sm md:text-base">
            <MessageSquare className="h-4 w-4" />
            <span>Conversations</span>
          </h3>
        </div>
        <Button 
          onClick={createNewConversation} 
          className="w-full"
          disabled={isLoading}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 md:p-2 space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative rounded-lg border p-2 md:p-3 cursor-pointer transition-colors ${
                selectedConversationId === conversation.id
                  ? 'bg-primary/10 border-primary/20'
                  : 'hover:bg-muted/50 border-transparent'
              }`}
              onClick={() => onConversationSelect(conversation.id)}
            >
              {editingId === conversation.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="h-7 md:h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={saveEdit} className="h-5 w-5 md:h-6 md:w-6 p-0">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-5 w-5 md:h-6 md:w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-medium text-xs md:text-sm truncate" title={getDisplayTitle(conversation)}>
                        {getDisplayTitle(conversation)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 md:mt-1">
                        {formatDate(conversation.updated_at)}
                      </p>
                    </div>
                    <div className="flex space-x-0.5 md:space-x-1 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(conversation);
                        }}
                        className="h-5 w-5 md:h-6 md:w-6 p-0"
                      >
                        <Edit2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="h-5 w-5 md:h-6 md:w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-center py-6 md:py-8 text-muted-foreground px-4">
              <MessageSquare className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs md:text-sm">No conversations yet</p>
              <p className="text-xs">Click "New Chat" to start</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};