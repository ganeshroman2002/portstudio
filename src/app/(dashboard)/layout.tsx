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

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch the user's detailed profile from the newly created profiles table
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        const isCompany = user.user_metadata?.role === 'company' || data?.account_type === 'company';
        if (isCompany) {
          router.push('/company');
          return;
        }

        if (data) {
          setProfile(data);
        }

        // Fetch suggested users (excluding current user)
        const { data: allUsers } = await supabase.from('profiles').select('*').neq('id', user.id).limit(50);
        
        if (allUsers && allUsers.length > 0) {
          // Shuffle all users first
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

          // Check which suggested users are already followed
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

  return (
    <div className="h-screen w-full flex justify-center bg-background text-foreground overflow-hidden font-sans">
      
      {/* Container to restrict max width like X */}
      <div className="w-full max-w-7xl h-full flex flex-row relative">
        
        {/* ========================================================= */}
        {/* LEFT SIDEBAR (Navigation)                                 */}
        {/* ========================================================= */}
        <header className="w-[68px] xl:w-[275px] h-full flex flex-col justify-between shrink-0 px-2 xl:px-4 py-4 overflow-y-auto hide-scrollbar border-r border-border">
          
          <div className="flex flex-col gap-2">
            {/* Logo */}
            <Link href="/" className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors mb-2 xl:ml-2">
              <span className="text-3xl font-black tracking-tighter">P<span className="hidden xl:inline text-xl">ort</span></span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1 w-full">
              {[
                { icon: Home, label: "Home", href: "/" },
                { icon: Bell, label: "Notifications", href: "/notifications" },
                { icon: Mail, label: "Messages", href: "/messages" },
                { icon: Calendar, label: "Schedule", href: "/schedule" },
                { icon: Star, label: "Premium", href: "/premium" },
                { icon: User, label: "Profile", href: "/profile" },
                { icon: Building2, label: "Companies", href: "/companies" },
                { icon: Settings, label: "Settings", href: "/settings" },
              ].map((item, idx) => {
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

        {/* ========================================================= */}
        {/* CENTER (Dynamic Page Content)                             */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* CENTER (Dynamic Page Content)                             */}
        {/* ========================================================= */}
        <main className={`flex-1 h-full overflow-y-auto hide-scrollbar ${(isPublishPage || pathname === '/') ? '' : 'max-w-[600px] border-r border-border'}`}>
          {children}
        </main>

        {/* ========================================================= */}
        {/* RIGHT SIDEBAR (Discovery)                                 */}
        {/* ========================================================= */}
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
            
            {suggestedUsers.map((user, i) => {
              const isFollowing = !!followingMap[user.id];
              const inProgress = !!followingInProgress[user.id];

              const handleToggle = async () => {
                const uid = (await supabase.auth.getUser()).data.user?.id;
                if (!uid || inProgress) return;
                setFollowingInProgress(prev => ({ ...prev, [user.id]: true }));
                if (isFollowing) {
                  await supabase.from('follows').delete().eq('follower_id', uid).eq('following_id', user.id);
                  setFollowingMap(prev => ({ ...prev, [user.id]: false }));
                } else {
                  await supabase.from('follows').insert({ follower_id: uid, following_id: user.id });
                  setFollowingMap(prev => ({ ...prev, [user.id]: true }));
                }
                setFollowingInProgress(prev => ({ ...prev, [user.id]: false }));
              };

              return (
                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <img src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold text-[15px] hover:underline">{user.full_name || 'User'}</span>
                      <span className="text-[15px] text-muted-foreground">{user.username ? `@${user.username}` : ''}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleToggle}
                    disabled={inProgress}
                    className={`px-4 py-1.5 rounded-full font-bold text-[14px] transition-all ${
                      isFollowing
                        ? 'border border-border text-foreground hover:border-rose-400 hover:text-rose-500'
                        : 'bg-foreground text-background hover:opacity-90'
                    }`}
                  >
                    {inProgress ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
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

      </div>
    </div>
  );
}
