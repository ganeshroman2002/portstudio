"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Loader2, Bell, MessageSquare, Briefcase } from "lucide-react";
import Link from "next/link";

export default function NotificationsView() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(full_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);
      setLoading(false);
    };
    fetchNotifications();
  }, [supabase]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-[14px] text-indigo-500 font-bold hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-1">You're all caught up!</h3>
            <p className="text-muted-foreground">No new notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`p-5 flex gap-4 transition-colors ${notif.read ? 'bg-background' : 'bg-indigo-500/5 dark:bg-indigo-500/10'}`}
              >
                <div className="shrink-0 pt-1">
                  {notif.type === 'message' ? (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                  ) : notif.type === 'invite' ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-[15px] leading-snug ${notif.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {notif.message}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </p>
                  {notif.link && (
                    <Link 
                      href={notif.link}
                      onClick={() => markAsRead(notif.id)}
                      className="inline-block mt-2 text-[13px] text-indigo-500 font-bold hover:underline"
                    >
                      View details
                    </Link>
                  )}
                </div>
                
                {!notif.read && (
                  <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-indigo-500 mt-2"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
