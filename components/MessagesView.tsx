"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Loader2, Send, User } from "lucide-react";

export default function MessagesView() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // Fetch conversations
      const { data: convs, error } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          participant1:profiles!participant1_id(id, full_name, avatar_url, account_type),
          participant2:profiles!participant2_id(id, full_name, avatar_url, account_type)
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
      }

      if (convs && convs.length > 0) {
        setConversations(convs);
        // Automatically select the first conversation if none is selected
        setActiveConversation(convs[0]);
        fetchMessages(convs[0].id);
      }
      setLoading(false);
    };
    init();
  }, [supabase]);

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) console.error("Error fetching messages:", error);
    if (data) setMessages(data);
  };

  const handleSelectConversation = (conv: any) => {
    setActiveConversation(conv);
    fetchMessages(conv.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !currentUser) return;
    setSending(true);

    const { data: msg } = await supabase.from('messages').insert({
      conversation_id: activeConversation.id,
      sender_id: currentUser.id,
      content: newMessage
    }).select().single();

    if (msg) {
      setMessages([...messages, msg]);
      setNewMessage("");
      
      // Update conversation updated_at
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', activeConversation.id);
      
      // Notify the other person
      const otherPersonId = activeConversation.participant1.id === currentUser.id 
        ? activeConversation.participant2.id 
        : activeConversation.participant1.id;
        
      await supabase.from('notifications').insert({
        user_id: otherPersonId,
        sender_id: currentUser.id,
        type: 'message',
        message: 'You have a new message.',
        link: '/messages'
      });
    }
    setSending(false);
  };

  const getOtherParticipant = (conv: any) => {
    return conv.participant1.id === currentUser?.id ? conv.participant2 : conv.participant1;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-background rounded-2xl border border-border overflow-hidden m-4 shadow-sm">
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 border-r border-border flex flex-col bg-slate-50/50 dark:bg-[#16181c]/50">
        <div className="p-4 border-b border-border bg-background">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No messages yet.</div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isActive = activeConversation?.id === conv.id;
              return (
                <div 
                  key={conv.id} 
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 border-b border-border cursor-pointer transition-colors flex items-center gap-3 ${isActive ? 'bg-slate-200/50 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-[#1e2128]'}`}
                >
                  {other.avatar_url ? (
                    <img src={other.avatar_url} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[15px] truncate">{other.full_name || 'User'}</h4>
                    <p className="text-[13px] text-muted-foreground truncate capitalize">{other.account_type}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Area: Chat Box */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeConversation ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3 bg-background sticky top-0 z-10 shadow-sm">
              <h3 className="font-bold text-lg">{getOtherParticipant(activeConversation).full_name || 'User'}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === currentUser.id;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-[#1e2128] text-foreground border border-border rounded-bl-sm'}`}>
                      <p className="text-[15px] whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-border bg-background">
              <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-100 dark:bg-[#202327] border border-transparent rounded-full px-5 py-3 focus:outline-none focus:bg-background focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[15px]"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim() || sending}
                  className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-1" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 bg-slate-100 dark:bg-[#1e2128] rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-slate-400" />
            </div>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
