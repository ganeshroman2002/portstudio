"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, Calendar, MapPin, Link as LinkIcon, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/client";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Posts");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-2 flex items-center gap-6 cursor-pointer border-b border-border">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold leading-tight">{profile?.full_name || "Complete Profile"}</h2>
          <span className="text-[13px] text-muted-foreground">{profile?.username ? `@${profile.username}` : ""}</span>
        </div>
      </div>

      {/* Banner & Avatar */}
      <div className="relative">
        <div className="w-full aspect-[3/1] bg-slate-200 dark:bg-slate-800">
          <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800" alt="Banner" className="w-full h-full object-cover" />
        </div>
        
        <div className="absolute -bottom-16 left-4 border-4 border-background rounded-full bg-slate-200">
          <img src={profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"} alt="Avatar" className="w-32 h-32 rounded-full object-cover" />
        </div>
        
        <div className="flex justify-end pt-3 px-4 h-[68px]">
          <Link href="/profile/edit" className="px-4 py-1.5 border border-border rounded-full font-bold hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors text-[15px]">
            Edit profile
          </Link>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-extrabold leading-tight">{profile?.full_name || "New User"}</h1>
            {profile?.username && <CheckCircle className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />}
          </div>
          <span className="text-[15px] text-muted-foreground">{profile?.username ? `@${profile.username}` : ""}</span>
        </div>

        <div className="mt-3 text-[15px] leading-snug">
          {profile?.bio || "This user hasn't written a bio yet."}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-[15px] text-muted-foreground">
          {profile?.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {profile.location}
            </div>
          )}
          {/* We will add real joined date and external links later */}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" /> Joined Recently
          </div>
        </div>

        <div className="flex gap-5 mt-3 text-[14px]">
          <div className="hover:underline cursor-pointer">
            <strong className="text-foreground">842</strong> <span className="text-muted-foreground">Following</span>
          </div>
          <div className="hover:underline cursor-pointer">
            <strong className="text-foreground">3,241</strong> <span className="text-muted-foreground">Followers</span>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
        {["Posts", "Replies", "Highlights", "Articles", "Media", "Likes"].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[80px] h-[53px] flex items-center justify-center relative hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors ${activeTab === tab ? 'font-bold text-foreground' : 'text-muted-foreground font-medium'}`}
          >
            <span>{tab}</span>
            {activeTab === tab && (
              <div className="absolute bottom-0 w-14 h-1 bg-indigo-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Feed Content Placeholder */}
      <div className="w-full">
        {[1, 2, 3].map((post) => (
          <div key={post} className="p-4 border-b border-border hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer flex gap-3">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80" alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-1 text-[15px]">
                <span className="font-bold hover:underline">Alex Stanton</span>
                <CheckCircle className="w-4 h-4 text-indigo-500 fill-indigo-500/20" />
                <span className="text-muted-foreground">@alexstanton · 2h</span>
              </div>
              <p className="text-[15px] mt-1">
                Just finished designing the new dashboard layout. Taking heavy inspiration from some of my favorite social platforms to ensure it feels incredibly familiar and user-friendly right out of the box! What do you guys think? 🎨✨
              </p>
              <div className="mt-3 w-full aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl border border-border overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800" alt="Post media" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
