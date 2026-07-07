"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Briefcase, Users, Star, TrendingUp, Search } from "lucide-react";
import Link from "next/link";

export default function CompanyDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, [supabase]);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">Welcome back, {profile?.full_name || 'Company'}!</h1>
          <p className="text-muted-foreground text-[15px]">Here's what's happening with your talent pipeline today.</p>
        </div>
        <Link href="/company/discover" className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold transition-colors flex items-center gap-2">
          <Search className="w-4 h-4" /> Find Talent
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Active Jobs", value: "3", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Saved Profiles", value: "12", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Interviews Scheduled", value: "4", icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Profile Views", value: "892", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-extrabold mb-1">{stat.value}</p>
            <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Users className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">No recent activity</h3>
        <p className="text-muted-foreground max-w-md mb-6">You haven't interacted with any talent recently. Head over to the discovery feed to start exploring PortStudio.</p>
        <Link href="/company/discover" className="px-6 py-3 bg-foreground text-background rounded-full font-bold transition-transform hover:scale-105">
          Discover Talent
        </Link>
      </div>
    </div>
  );
}
