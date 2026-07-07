"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Home, Search, Bell, Mail, Settings, Calendar } from "lucide-react";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
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
        .select('account_type')
        .eq('id', user.id)
        .single();

      const isCompany = user.user_metadata?.role === 'company' || profile?.account_type === 'company';

      if (!isCompany) {
        // Not a company account, redirect to main dashboard
        router.push("/");
        return;
      }

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
            { icon: Settings, label: "Settings", href: "/company/settings", active: false },
          ].map((item, i) => (
            <Link key={i} href={item.href} className={`flex items-center justify-center lg:justify-start gap-4 p-3 lg:px-4 lg:py-3 rounded-full transition-colors group ${item.active ? 'font-bold' : 'hover:bg-slate-200/20 dark:hover:bg-slate-800/50'}`}>
              <item.icon className={`w-7 h-7 ${item.active ? 'text-foreground' : 'text-foreground group-hover:scale-110 transition-transform'}`} strokeWidth={item.active ? 2.5 : 2} />
              <span className={`hidden lg:block text-xl ${item.active ? 'text-foreground' : 'text-foreground'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
