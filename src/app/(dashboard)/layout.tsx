"use client";
import React, { useState, useEffect } from "react";
import { 
  Home, Search, Bell, Mail, Star, User, MoreHorizontal, 
  Settings, Sparkles, Plus, Calendar, Building2
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublishPage = pathname === '/publish';
  const [profile, setProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followingInProgress, setFollowingInProgress] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  const handleToggleFollow = async (e: React.MouseEvent, targetUserId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId || followingInProgress[targetUserId]) return;
    
    setFollowingInProgress(prev => ({ ...prev, [targetUserId]: true }));
    
    if (followingMap[targetUserId]) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);
      setFollowingMap(prev => ({ ...prev, [targetUserId]: false }));
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetUserId });
      setFollowingMap(prev => ({ ...prev, [targetUserId]: true }));
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        sender_id: currentUserId,
        type: 'follow',
        message: `${profile?.full_name || 'Someone'} started following you.`,
        link: '/profile',
      });
    }
    setFollowingInProgress(prev => ({ ...prev, [targetUserId]: false }));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        const isCompany = user.user_metadata?.role === 'company' || data?.account_type === 'company';
        if (isCompany) {
          router.push('/company');
          return;
        }

        if (data) {
          setProfile(data);
        }

        const { data: allUsers } = await supabase.from('profiles').select('*').neq('id', user.id).limit(50);
        
        if (allUsers && allUsers.length > 0) {
          const shuffledUsers = [...allUsers].sort(() => 0.5 - Math.random());
          let selectedUsers: any[] = [];
          
          if (data?.skills && data.skills.length > 0) {
            const scoredUsers = shuffledUsers.map(u => {
              const overlap = (u.skills || []).filter((s: string) => data.skills.includes(s)).length;
              return { user: u, score: overlap };
            });
            scoredUsers.sort((a, b) => b.score - a.score);
            const topMatches = scoredUsers.filter(u => u.score > 0).slice(0, 2).map(u => u.user);
            const remainingNeeded = 3 - topMatches.length;
            const remainingUsers = shuffledUsers.filter(u => !topMatches.find(tm => tm.id === u.id));
            selectedUsers = [...topMatches, ...remainingUsers.slice(0, remainingNeeded)];
          } else {
            selectedUsers = shuffledUsers.slice(0, 3);
          }
          
          selectedUsers = selectedUsers.sort(() => 0.5 - Math.random());
          setSuggestedUsers(selectedUsers);
          localStorage.setItem('portstudio_suggested_users', JSON.stringify(selectedUsers));

          if (selectedUsers.length > 0) {
            const { data: myFollows } = await supabase
              .from('follows')
              .select('following_id')
              .eq('follower_id', user.id)
              .in('following_id', selectedUsers.map(u => u.id));
            const map: Record<string, boolean> = {};
            (myFollows ?? []).forEach((f: any) => { map[f.following_id] = true; });
            setFollowingMap(map);
          }
        }
      }
    };
    fetchProfile();
  }, []);

  // ─── Bottom nav items (mobile) ───────────────────────────────────────────────
  const bottomNavItems = [
    { icon: Home,      label: "Home",      href: "/" },
    { icon: Calendar,  label: "Schedule",  href: "/schedule" },
    { icon: Star,      label: "Premium",   href: "/premium" },
    { icon: User,      label: "Profile",   href: "/profile" },
    { icon: Building2, label: "Companies", href: "/companies" },
    { icon: Settings,  label: "Settings",  href: "/settings" },
  ];

  // ─── Left sidebar items (desktop) ───────────────────────────────────────────
  const sidebarItems = [
    { icon: Home,      label: "Home",          href: "/" },
    { icon: Bell,      label: "Notifications", href: "/notifications" },
    { icon: Mail,      label: "Messages",      href: "/messages" },
    { icon: Calendar,  label: "Schedule",      href: "/schedule" },
    { icon: Star,      label: "Premium",       href: "/premium" },
    { icon: User,      label: "Profile",       href: "/profile" },
    { icon: Building2, label: "Companies",     href: "/companies" },
    { icon: Settings,  label: "Settings",      href: "/settings" },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground font-sans">

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MOBILE TOP BAR  (hidden on md+)                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50 shrink-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-2xl font-black tracking-tighter">Port<span className="text-indigo-500">Studio</span></span>
        </Link>

        {/* Right icons: Messages + Notifications */}
        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${pathname === '/notifications' ? 'text-foreground bg-slate-100 dark:bg-slate-800' : 'text-foreground/80 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Bell className="w-5 h-5" strokeWidth={pathname === '/notifications' ? 2.5 : 2} />
          </Link>
          <Link
            href="/messages"
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${pathname === '/messages' ? 'text-foreground bg-slate-100 dark:bg-slate-800' : 'text-foreground/80 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Mail className="w-5 h-5" strokeWidth={pathname === '/messages' ? 2.5 : 2} />
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MAIN BODY (sidebar + content)                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* Inner wrapper to cap width */}
        <div className="w-full max-w-7xl mx-auto h-full flex flex-row relative">

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* LEFT SIDEBAR — hidden on mobile, shown on md+              */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <header className="hidden md:flex w-[68px] xl:w-[275px] h-full flex-col justify-between shrink-0 px-2 xl:px-4 py-4 overflow-y-auto hide-scrollbar border-r border-border">
            
            <div className="flex flex-col gap-2">
              {/* Logo */}
              <Link href="/" className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors mb-2 xl:ml-2">
                <span className="text-3xl font-black tracking-tighter">P<span className="hidden xl:inline text-xl">ort</span></span>
              </Link>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1 w-full">
                {sidebarItems.map((item, idx) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                  return (
                    <Link key={idx} href={item.href} className="flex items-center gap-4 p-3 rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors w-fit xl:w-full">
                      <item.icon className={`w-7 h-7 ${isActive ? 'text-foreground' : 'text-foreground/80'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className={`hidden xl:block text-xl ${isActive ? 'font-bold text-foreground' : 'font-normal text-foreground/90'}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Post Button */}
              <Link href="/publish" className="w-12 h-12 xl:w-full xl:h-[52px] bg-indigo-500 hover:bg-indigo-600 text-white rounded-full mt-4 flex items-center justify-center transition-colors shadow-sm">
                <span className="hidden xl:block text-[17px] font-bold">Publish Pitch</span>
                <Plus className="w-6 h-6 xl:hidden" />
              </Link>
            </div>

            {/* User Profile Mini */}
            <div className="mt-auto pt-4 pb-2">
              <button className="flex items-center justify-between w-full p-3 rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <img 
                    src={profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                  <div className="hidden xl:flex flex-col items-start leading-tight">
                    <span className="font-bold text-[15px] truncate max-w-[120px]">{profile?.full_name || "New User"}</span>
                    <span className="text-[15px] text-muted-foreground truncate max-w-[120px]">
                      {profile?.username ? `@${profile.username}` : "Complete profile"}
                    </span>
                  </div>
                </div>
                <MoreHorizontal className="hidden xl:block w-5 h-5 shrink-0" />
              </button>
            </div>
          </header>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* CENTER (Dynamic Page Content)                              */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <main className={`flex-1 h-full overflow-y-auto hide-scrollbar pb-16 md:pb-0 ${(isPublishPage || pathname === '/') ? '' : 'md:max-w-[600px] border-r border-border'}`}>
            {children}
          </main>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* RIGHT SIDEBAR (Discovery) — desktop only                  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {!(isPublishPage || pathname === '/') && (
            <aside className="hidden lg:flex flex-col w-[350px] shrink-0 px-4 py-1 h-full overflow-y-auto hide-scrollbar">
            
              {/* Search Bar */}
              <div className="sticky top-0 bg-background pt-1 pb-3 z-10">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search"
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-[#202327] border border-transparent rounded-full text-[15px] focus:bg-background focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-muted-foreground"
                  />
                </div>
              </div>

              {/* You Might Like Widget */}
              <div className="bg-slate-50 dark:bg-[#16181c] rounded-2xl border border-border mb-4 pt-3 pb-1">
                <h2 className="px-4 text-[20px] font-extrabold mb-3">You might like</h2>
                
                {suggestedUsers.map((user) => {
                  const isFollowing = !!followingMap[user.id];
                  const inProgress = !!followingInProgress[user.id];

                  const handleToggle = async (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!currentUserId || inProgress) return;
                    setFollowingInProgress(prev => ({ ...prev, [user.id]: true }));
                    if (followingMap[user.id]) {
                      await supabase.from('follows').delete()
                        .eq('follower_id', currentUserId)
                        .eq('following_id', user.id);
                      setFollowingMap(prev => ({ ...prev, [user.id]: false }));
                    } else {
                      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: user.id });
                      setFollowingMap(prev => ({ ...prev, [user.id]: true }));
                      await supabase.from('notifications').insert({
                        user_id: user.id,
                        sender_id: currentUserId,
                        type: 'follow',
                        message: `${profile?.full_name || 'Someone'} started following you.`,
                        link: '/profile',
                      });
                    }
                    setFollowingInProgress(prev => ({ ...prev, [user.id]: false }));
                  };

                  return (
                    <Link
                      key={user.id}
                      href={`/profile?id=${user.id}`}
                      className="px-4 py-3 flex items-center justify-between hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex gap-3 min-w-0">
                        <img
                          src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div className="flex flex-col leading-tight min-w-0">
                          <span className="font-bold text-[15px] hover:underline truncate">{user.full_name || 'User'}</span>
                          <span className="text-[14px] text-muted-foreground truncate">{user.username ? `@${user.username}` : ''}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleToggle}
                        disabled={inProgress}
                        className={`ml-3 shrink-0 px-4 py-1.5 rounded-full font-bold text-[14px] transition-all ${
                          isFollowing
                            ? 'border border-border text-foreground hover:border-rose-400 hover:text-rose-500'
                            : 'bg-foreground text-background hover:opacity-90'
                        }`}
                      >
                        {inProgress ? '...' : isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </Link>
                  );
                })}
                <div className="px-4 py-4 text-[15px] text-indigo-500 hover:bg-slate-200/20 dark:hover:bg-slate-800/50 rounded-b-2xl cursor-pointer transition-colors">
                  Show more
                </div>
              </div>

              {/* What's Happening Widget */}
              <div className="bg-slate-50 dark:bg-[#16181c] rounded-2xl border border-border pt-3 pb-1">
                <h2 className="px-4 text-[20px] font-extrabold mb-3">What's happening</h2>
                
                {[
                  { category: "Trending in Tech", topic: "Next.js 14", posts: "24.5K" },
                  { category: "Design · Trending", topic: "Figma UI", posts: "12.1K" },
                  { category: "Development", topic: "TailwindCSS", posts: "8,231" }
                ].map((trend, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex justify-between">
                    <div className="flex flex-col">
                      <span className="text-[13px] text-muted-foreground">{trend.category}</span>
                      <span className="font-bold text-[15px] mt-0.5">{trend.topic}</span>
                      <span className="text-[13px] text-muted-foreground mt-0.5">{trend.posts} posts</span>
                    </div>
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
                <div className="px-4 py-4 text-[15px] text-indigo-500 hover:bg-slate-200/20 dark:hover:bg-slate-800/50 rounded-b-2xl cursor-pointer transition-colors">
                  Show more
                </div>
              </div>
            </aside>
          )}

        </div>{/* /max-w-7xl */}
      </div>{/* /flex-1 */}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MOBILE BOTTOM NAV  (hidden on md+)                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
        {/* Publish Pitch FAB */}
        <Link
          href="/publish"
          className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </Link>

        <div className="flex items-center justify-around px-2 pt-1 pb-safe-area-inset-bottom">
          {bottomNavItems.map((item, idx) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 flex-1 transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 transition-all ${isActive ? 'text-indigo-500' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] leading-none truncate font-medium ${isActive ? 'text-indigo-500' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
