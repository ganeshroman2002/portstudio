"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, ArrowLeft, LogOut, Bell, UserPlus, MessageCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/client";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [pitchesCount, setPitchesCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('portstudio_view_mode') as 'grid' | 'list';
    if (savedMode) setViewMode(savedMode);

    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setUserProfile(data);
          setNotificationsEnabled(data.notifications_enabled !== false);
          setFollowNotifications(data.follow_notifications !== false);
          setMessageNotifications(data.message_notifications !== false);
        }
        
        // Fetch how many pitches the user has actually posted
        const { count } = await supabase
          .from('talent_pitches')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', user.id);
          
        setPitchesCount(count || 0);
      }
    };
    fetchProfileData();
  }, [supabase]);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('portstudio_view_mode', mode);
    window.dispatchEvent(new CustomEvent('viewModeChanged', { detail: mode }));
  };

  const toggleNotifications = async () => {
    if (!userProfile) return;
    setSaving(true);
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    const { error } = await supabase.from('profiles').update({ notifications_enabled: newValue }).eq('id', userProfile.id);
    if (error) {
      alert("Failed to update settings: " + error.message);
      setNotificationsEnabled(!newValue);
    }
    setSaving(false);
  };

  const toggleFollowNotifications = async () => {
    if (!userProfile) return;
    setSaving(true);
    const newValue = !followNotifications;
    setFollowNotifications(newValue);
    const { error } = await supabase.from('profiles').update({ follow_notifications: newValue }).eq('id', userProfile.id);
    if (error) {
      setFollowNotifications(!newValue);
    }
    setSaving(false);
  };

  const toggleMessageNotifications = async () => {
    if (!userProfile) return;
    setSaving(true);
    const newValue = !messageNotifications;
    setMessageNotifications(newValue);
    const { error } = await supabase.from('profiles').update({ message_notifications: newValue }).eq('id', userProfile.id);
    if (error) {
      setMessageNotifications(!newValue);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (!mounted) return null;

  return (
    <>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-2 flex items-center gap-6 border-b border-border">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold leading-tight">Settings</h2>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-extrabold mb-4">Appearance</h3>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[15px]">Dark Mode</p>
              <p className="text-[14px] text-muted-foreground">Adjust the appearance of the application.</p>
            </div>
            
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border p-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[15px]">Feed View</p>
              <p className="text-[14px] text-muted-foreground">Choose your preferred default feed layout.</p>
            </div>
            
            <div className="flex bg-slate-200/50 dark:bg-slate-800 rounded-lg p-1">
              <button 
                onClick={() => handleSetViewMode('grid')} 
                className={`px-4 py-1.5 rounded-md transition-colors text-[14px] font-bold ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Grid
              </button>
              <button 
                onClick={() => handleSetViewMode('list')} 
                className={`px-4 py-1.5 rounded-md transition-colors text-[14px] font-bold ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-extrabold mb-4 mt-8">Notifications</h3>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border overflow-hidden">
          {/* Master toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-[15px]">Push Notifications</p>
                <p className="text-[14px] text-muted-foreground">Master switch for all notifications.</p>
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

          {/* Follow notifications */}
          <div className={`flex items-center justify-between p-4 border-b border-border transition-opacity ${!notificationsEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-[15px]">Follow Notifications</p>
                <p className="text-[14px] text-muted-foreground">Get notified when someone follows you.</p>
              </div>
            </div>
            <button 
              onClick={toggleFollowNotifications}
              disabled={saving}
              className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${followNotifications ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${followNotifications ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Message notifications */}
          <div className={`flex items-center justify-between p-4 transition-opacity ${!notificationsEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-[15px]">Message Notifications</p>
                <p className="text-[14px] text-muted-foreground">Get notified when you receive a new message.</p>
              </div>
            </div>
            <button 
              onClick={toggleMessageNotifications}
              disabled={saving}
              className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${messageNotifications ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${messageNotifications ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <h3 className="text-xl font-extrabold mb-4 mt-8">Subscription</h3>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[15px]">Current Plan</p>
                <p className="text-[14px] text-indigo-500 font-bold">Free Tier</p>
              </div>
              <Link href="/premium" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold transition-colors text-[14px]">
                Upgrade
              </Link>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between text-[13px] mb-1">
                <span className="font-bold">Pitches Available</span>
                <span className="text-muted-foreground">{Math.max(0, (userProfile?.available_pitches ?? 3) - pitchesCount)} Left</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (Math.max(0, (userProfile?.available_pitches ?? 3) - pitchesCount) / 10) * 100)}%` }}></div>
              </div>
              <p className="text-[12px] text-muted-foreground mt-2 text-right">Need more? Buy a Pitch Booster.</p>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-extrabold mb-4 mt-8">Account</h3>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[15px] text-rose-500">Log Out</p>
              <p className="text-[14px] text-muted-foreground">Securely sign out of your account.</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
