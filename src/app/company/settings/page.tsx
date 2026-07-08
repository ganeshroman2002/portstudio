"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Bell, Loader2, LogOut, UserPlus, MessageCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function CompanySettingsPage() {
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setUserProfile(profile);
          setNotificationsEnabled(profile.notifications_enabled !== false);
          setFollowNotifications(profile.follow_notifications !== false);
          setMessageNotifications(profile.message_notifications !== false);
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, [supabase]);

  const toggle = async (field: string, value: boolean, setter: (v: boolean) => void) => {
    if (!userProfile) return;
    setSaving(true);
    setter(value);
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', userProfile.id);
    if (error) {
      setter(!value);
      alert("Failed to update settings: " + error.message);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (loading || !mounted) {
    return (
      <div className="flex-1 flex justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const ToggleRow = ({
    icon, iconBg, iconColor, title, description, value, onToggle, disabled = false
  }: any) => (
    <div className={`flex items-center justify-between p-5 border-b border-border last:border-b-0 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconBg} ${iconColor} rounded-2xl flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-[15px]">{title}</h3>
          <p className="text-muted-foreground text-[13px]">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={saving}
        className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${value ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${value ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-8 pb-24">
      <h1 className="text-3xl font-extrabold mb-8">Settings</h1>

      {/* Appearance */}
      <h2 className="text-lg font-extrabold mb-3 text-muted-foreground uppercase tracking-wider text-[13px]">Appearance</h2>
      <div className="bg-card rounded-3xl border border-border overflow-hidden mb-6 shadow-sm">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0">
              {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-[15px]">Theme</h3>
              <p className="text-muted-foreground text-[13px]">Currently using {theme === 'dark' ? 'dark' : 'light'} mode.</p>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold text-[14px] transition-colors"
          >
            {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>

      {/* Notifications */}
      <h2 className="text-lg font-extrabold mb-3 text-muted-foreground uppercase tracking-wider text-[13px]">Notifications</h2>
      <div className="bg-card rounded-3xl border border-border overflow-hidden mb-6 shadow-sm">
        <ToggleRow
          icon={<Bell className="w-6 h-6" />}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
          title="Push Notifications"
          description="Master switch for all notifications."
          value={notificationsEnabled}
          onToggle={() => toggle('notifications_enabled', !notificationsEnabled, setNotificationsEnabled)}
        />
        <ToggleRow
          icon={<UserPlus className="w-6 h-6" />}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
          title="Follow Notifications"
          description="Get notified when talent follows you."
          value={followNotifications}
          onToggle={() => toggle('follow_notifications', !followNotifications, setFollowNotifications)}
          disabled={!notificationsEnabled}
        />
        <ToggleRow
          icon={<MessageCircle className="w-6 h-6" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          title="Message Notifications"
          description="Get notified when you receive a new message."
          value={messageNotifications}
          onToggle={() => toggle('message_notifications', !messageNotifications, setMessageNotifications)}
          disabled={!notificationsEnabled}
        />
      </div>

      {/* Account */}
      <h2 className="text-lg font-extrabold mb-3 text-muted-foreground uppercase tracking-wider text-[13px]">Account</h2>
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-rose-500">Log Out</h3>
              <p className="text-muted-foreground text-[13px]">Securely sign out of your company account.</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full font-bold text-[14px] transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
