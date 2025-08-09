import { getSupabase } from '../utils/supabase';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

interface Conversation {
  id: string;
  user_id: string;
  type: 'past_self' | 'future_self' | 'reflection';
  messages: ChatMessage[];
  voice_message_url?: string;
  created_at: string;
  updated_at: string;
}

// In-memory fallback for when Supabase is not available
const memoryConversations: Map<string, Conversation> = new Map();

export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      // Get the most recent conversation for this user
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'reflection') // Use reflection type for general chat
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching chat history:', error);
        return [];
      }
      
      return data?.messages || [];
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
  }
  
  // Fallback to in-memory storage
  const conversation = Array.from(memoryConversations.values())
    .find(conv => conv.user_id === userId && conv.type === 'reflection');
  
  return conversation?.messages || [];
}

export async function saveChatMessage(userId: string, message: ChatMessage): Promise<void> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      // Get existing conversation or create new one
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'reflection')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (existingConv) {
        // Update existing conversation
        const updatedMessages = [...(existingConv.messages || []), message];
        
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ 
            messages: updatedMessages,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConv.id);
        
        if (updateError) {
          console.error('Error updating conversation:', updateError);
        }
      } else {
        // Create new conversation
        const { error: insertError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            type: 'reflection',
            messages: [message]
          });
        
        if (insertError) {
          console.error('Error creating conversation:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in saveChatMessage:', error);
    }
  } else {
    // Fallback to in-memory storage
    let conversation = Array.from(memoryConversations.values())
      .find(conv => conv.user_id === userId && conv.type === 'reflection');
    
    if (!conversation) {
      conversation = {
        id: Date.now().toString(),
        user_id: userId,
        type: 'reflection',
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryConversations.set(conversation.id, conversation);
    }
    
    conversation.messages.push(message);
    conversation.updated_at = new Date().toISOString();
  }
}

export async function clearChatHistory(userId: string): Promise<void> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'reflection');
      
      if (error) {
        console.error('Error clearing chat history:', error);
      }
    } catch (error) {
      console.error('Error in clearChatHistory:', error);
    }
  } else {
    // Fallback to in-memory storage
    for (const [id, conversation] of memoryConversations.entries()) {
      if (conversation.user_id === userId && conversation.type === 'reflection') {
        memoryConversations.delete(id);
      }
    }
  }
}