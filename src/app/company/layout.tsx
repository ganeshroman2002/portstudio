"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { Loader2, User, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Home, Search, Bell, Mail, Settings, Calendar } from "lucide-react";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkCompanyAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const isCompany = user.user_metadata?.role === 'company' || profile?.account_type === 'company';

      if (!isCompany) {
        // Not a company account, redirect to main dashboard
        router.push("/");
        return;
      }

      if (profile) setProfile(profile);
      setLoading(false);
    };

    checkCompanyAccess();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <aside className="w-20 lg:w-[275px] h-full flex flex-col items-center lg:items-start lg:pl-8 lg:pr-6 py-4 border-r border-border shrink-0 bg-background relative z-20">
        <Link href="/company" className="w-12 h-12 lg:w-fit flex items-center justify-center lg:justify-start gap-3 rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors mb-4 lg:mb-8 lg:px-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl rounded-tl-none">
            C
          </div>
          <span className="hidden lg:block text-2xl font-bold tracking-tight text-foreground">
            Company
          </span>
        </Link>
        
        <nav className="flex flex-col gap-2 w-full lg:px-2">
          {[
            { icon: Home, label: "Dashboard", href: "/company", active: true },
            { icon: Search, label: "Discover Talent", href: "/company/discover", active: false },
            { icon: Bell, label: "Notifications", href: "/company/notifications", active: false },
            { icon: Mail, label: "Messages", href: "/company/messages", active: false },
            { icon: Calendar, label: "Schedule", href: "/company/schedule", active: false },
            { icon: User, label: "Profile", href: "/company/profile", active: false },
            { icon: Settings, label: "Settings", href: "/company/settings", active: false },
          ].map((item, i) => {
            const isActive = typeof window !== 'undefined' && window.location.pathname.startsWith(item.href) && (item.href !== '/company' || window.location.pathname === '/company');
            return (
              <Link key={i} href={item.href} className={`flex items-center justify-center lg:justify-start gap-4 p-3 lg:px-4 lg:py-3 rounded-full transition-colors group ${isActive ? 'bg-slate-200/50 dark:bg-slate-800 font-bold' : 'hover:bg-slate-200/20 dark:hover:bg-slate-800/50'}`}>
                <item.icon className={`w-7 h-7 ${isActive ? 'text-foreground' : 'text-foreground group-hover:scale-110 transition-transform'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`hidden lg:block text-xl ${isActive ? 'text-foreground' : 'text-foreground'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile Mini */}
        <div className="mt-auto pt-4 pb-2 w-full lg:px-2">
          <Link href="/company/profile" className="flex items-center justify-between w-full p-3 rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <img 
                src={profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full object-cover shrink-0" 
              />
              <div className="hidden lg:flex flex-col items-start leading-tight min-w-0">
                <span className="font-bold text-[15px] truncate max-w-[120px]">{profile?.full_name || "Company"}</span>
                <span className="text-[15px] text-muted-foreground truncate max-w-[120px]">
                  {profile?.username ? `@${profile.username}` : "Setup profile"}
                </span>
              </div>
            </div>
            <MoreHorizontal className="hidden lg:block w-5 h-5 shrink-0 text-muted-foreground" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
