"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Bell, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setUserProfile(profile);
          // If notifications_enabled is literally missing, default to true
          setNotificationsEnabled(profile.notifications_enabled !== false);
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, [supabase]);

  const toggleNotifications = async () => {
    if (!userProfile) return;
    setSaving(true);
    
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    
    const { error } = await supabase
      .from('profiles')
      .update({ notifications_enabled: newValue })
      .eq('id', userProfile.id);
      
    if (error) {
      alert("Failed to update settings: " + error.message);
      setNotificationsEnabled(!newValue); // revert
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-8">
      <h1 className="text-3xl font-extrabold mb-8">Settings</h1>
      
      <div className="bg-background rounded-3xl border border-border p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Push Notifications</h3>
            <p className="text-muted-foreground text-sm">Receive alerts for messages and interviews.</p>
          </div>
        </div>
        
        <button 
          onClick={toggleNotifications}
          disabled={saving}
          className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${notificationsEnabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  );
}
