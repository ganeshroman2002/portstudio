"use client";
import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Loader2, Building2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/client";

export default function CompanyProfilePage() {
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
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-[800px] mx-auto h-full overflow-y-auto bg-slate-50 dark:bg-background border-r border-border shadow-sm">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 py-3 flex items-center gap-6 cursor-pointer border-b border-border">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold leading-tight">{profile?.full_name || "Company Profile"}</h2>
          <span className="text-[13px] text-muted-foreground">{profile?.username ? `@${profile.username}` : "Manage your organization"}</span>
        </div>
      </div>

      <div className="pb-24">
        {/* Banner & Avatar */}
        <div className="w-full aspect-[3/1] bg-slate-200 dark:bg-slate-800 relative">
          {profile?.banner_url && <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />}

          <div className="absolute -bottom-16 left-8 rounded-full border-4 border-background bg-slate-200">
             <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-slate-900">
               {profile?.avatar_url ? (
                 <img src={profile.avatar_url} className="w-full h-full object-cover" />
               ) : (
                 <Building2 className="w-12 h-12 text-slate-400" />
               )}
             </div>
          </div>
        </div>

        <div className="flex justify-end items-start gap-4 pt-4 px-8 h-[72px]">
          <Link href="/company/profile/edit" className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold transition-colors text-[14px]">
            Edit Profile
          </Link>
        </div>

        {/* Profile Info */}
        <div className="px-8 pt-4 flex flex-col gap-5">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold leading-tight">{profile?.full_name || "Company Name"}</h1>
            <span className="text-lg text-muted-foreground mt-0.5">@{profile?.username || "company"}</span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-muted-foreground font-medium">
            {profile?.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {profile.location}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Joined Recently
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-bold text-lg mb-3">About</h3>
            {profile?.bio ? (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90 bg-card p-6 rounded-2xl border border-border">
                {profile.bio}
              </p>
            ) : (
              <p className="text-[15px] text-muted-foreground bg-slate-50 dark:bg-[#16181c] p-6 rounded-2xl border border-border border-dashed text-center">
                You haven't written a bio for your company yet.
              </p>
            )}
          </div>
          
          <div className="mt-8 flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-[#16181c] rounded-3xl border border-border shadow-sm">
            <Building2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-bold mb-2">Open Positions</h3>
            <p className="text-muted-foreground font-medium text-center max-w-sm mb-6">
              You haven't posted any jobs yet. Post a job to attract top talent directly to your pipeline.
            </p>
            <button className="px-6 py-2.5 bg-foreground text-background font-bold rounded-full transition-transform hover:scale-105">
              Post a Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
