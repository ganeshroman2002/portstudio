"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/client";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('portstudio_view_mode') as 'grid' | 'list';
    if (savedMode) setViewMode(savedMode);
  }, []);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('portstudio_view_mode', mode);
    window.dispatchEvent(new CustomEvent('viewModeChanged', { detail: mode }));
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
                <span className="font-bold">Pitch Limit</span>
                <span className="text-muted-foreground">Max 3 allowed</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '33%' }}></div>
              </div>
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
