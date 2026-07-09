"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Calendar, MapPin, Link as LinkIcon, ArrowLeft, Loader2, X, Code, Sparkles, UserPlus, UserMinus, Heart } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/client";

function ProfileContent() {
  const searchParams = useSearchParams();
  const viewedId = searchParams.get('id'); // if set, we're viewing another user

  const [activeTab, setActiveTab] = useState("Posts");
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pitches, setPitches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPitch, setSelectedPitch] = useState<any>(null);

  // Real follow data
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [modalList, setModalList] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followingInProgress, setFollowingInProgress] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // For viewing another user — are we following them?
  const [isFollowingViewed, setIsFollowingViewed] = useState(false);
  const [followingViewed, setFollowingViewed] = useState(false);

  const supabase = createClient();
  const isOwnProfile = !viewedId || viewedId === currentUserId;

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/((?:^|\s)[@#][a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      const isTag = /^(?:\s*)([@#][a-zA-Z0-9_]+)$/.test(part);
      if (isTag) {
        const match = part.match(/([@#][a-zA-Z0-9_]+)/);
        const tag = match ? match[1] : part;
        const prefix = part.replace(tag, '');
        return (
          <React.Fragment key={i}>
            {prefix}
            <span className="text-indigo-500 font-bold hover:underline cursor-pointer">{tag}</span>
          </React.Fragment>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const handleDeletePitch = async (pitchId: string) => {
    if (!confirm('Are you sure you want to delete this pitch? You will regain a pitch slot.')) return;
    const { error } = await supabase.from('talent_pitches').delete().eq('id', pitchId);
    if (!error) {
      setPitches(pitches.filter(p => p.id !== pitchId));
    } else {
      alert("Failed to delete pitch: " + error.message);
    }
  };

  // Fetch real follow counts for the current user
  const fetchFollowCounts = useCallback(async (userId: string) => {
    const [{ count: frs }, { count: fng }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    setFollowersCount(frs ?? 0);
    setFollowingCount(fng ?? 0);
  }, [supabase]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const targetId = viewedId || user.id;

        const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single();
        if (data) setProfile(data);

        const { data: userPitches } = await supabase
          .from('talent_pitches')
          .select('*, profiles(full_name, username, avatar_url)')
          .eq('profile_id', targetId)
          .order('created_at', { ascending: false });
        if (userPitches) setPitches(userPitches);

        await fetchFollowCounts(targetId);

        // If viewing another user, check if current user follows them
        if (viewedId && viewedId !== user.id) {
          const { data: followRow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', viewedId)
            .single();
          setIsFollowingViewed(!!followRow);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [viewedId]);

  // Open followers/following modal and load real list
  const openFollowModal = useCallback(async (type: 'followers' | 'following') => {
    const targetId = viewedId || currentUserId;
    if (!targetId || !currentUserId) return;
    setFollowModal(type);
    setModalLoading(true);
    setModalList([]);

    let profileIds: string[] = [];

    if (type === 'followers') {
      // People who follow the viewed user
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', targetId);
      profileIds = (data ?? []).map((r: any) => r.follower_id);
    } else {
      // People the viewed user follows
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', targetId);
      profileIds = (data ?? []).map((r: any) => r.following_id);
    }

    if (profileIds.length === 0) {
      setModalList([]);
      setModalLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio')
      .in('id', profileIds);

    setModalList(profiles ?? []);

    // For each listed user, check if current user is following them
    if (profiles && profiles.length > 0) {
      const { data: myFollows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .in('following_id', profiles.map((p: any) => p.id));

      const map: Record<string, boolean> = {};
      (myFollows ?? []).forEach((f: any) => { map[f.following_id] = true; });
      setFollowingMap(map);
    }

    setModalLoading(false);
  }, [currentUserId, supabase, viewedId]);

  // Toggle follow / unfollow for a user in the modal
  const handleToggleFollow = async (targetId: string) => {
    if (!currentUserId || followingInProgress[targetId]) return;
    setFollowingInProgress(prev => ({ ...prev, [targetId]: true }));

    const isFollowing = !!followingMap[targetId];

    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetId);
      setFollowingMap(prev => ({ ...prev, [targetId]: false }));
      // If viewing 'following' list and we unfollowed, remove from list + update count (only if own profile)
      if (followModal === 'following' && isOwnProfile) {
        setModalList(prev => prev.filter(u => u.id !== targetId));
        setFollowingCount(c => Math.max(0, c - 1));
      }
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId });
      setFollowingMap(prev => ({ ...prev, [targetId]: true }));
      if (followModal === 'followers' && isOwnProfile) {
        setFollowingCount(c => c + 1);
      }  // Send a follow notification to the target user
      await supabase.from('notifications').insert({
        user_id: targetId,
        sender_id: currentUserId,
        type: 'follow',
        message: `${profile?.full_name || 'Someone'} started following you.`,
        link: '/profile',
      });
    }

    setFollowingInProgress(prev => ({ ...prev, [targetId]: false }));
  };

  const handleToggleLike = async (pitchId: string, currentLikes: string[]) => {
    if (!currentUserId) return;
    const isLiked = currentLikes.includes(currentUserId);
    const newLikes = isLiked 
      ? currentLikes.filter(id => id !== currentUserId)
      : [...currentLikes, currentUserId];

    setPitches(prev => prev.map(p => p.id === pitchId ? { ...p, liked_by: newLikes } : p));
    if (selectedPitch && selectedPitch.id === pitchId) {
      setSelectedPitch({ ...selectedPitch, liked_by: newLikes });
    }
    const { error } = await supabase.rpc('toggle_like', {
      target_pitch_id: pitchId,
      target_user_id: currentUserId
    });
    
    if (error) {
      console.error('Failed to toggle like:', error);
      alert('Error saving like: ' + error.message);
    }
  };

  const handleShareProfile = async (username?: string) => {
    if (!username) return;
    const url = `${window.location.origin}/profile?id=${username}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Profile link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ─── Follow Modal ────────────────────────────────────────────────────────────
  if (followModal) {
    return (
      <div className="w-full flex flex-col h-full bg-background relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-2 flex items-center gap-6 cursor-pointer border-b border-border">
          <button onClick={() => setFollowModal(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold leading-tight">{profile?.full_name}</h2>
            <span className="text-[13px] text-muted-foreground">@{profile?.username}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {(['followers', 'following'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => openFollowModal(tab)}
              className={`flex-1 h-[53px] flex items-center justify-center relative hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors ${followModal === tab ? 'font-bold text-foreground' : 'text-muted-foreground font-medium'}`}
            >
              <span className="capitalize">{tab}</span>
              {followModal === tab && (
                <div className="absolute bottom-0 w-16 h-1 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 w-full overflow-y-auto">
          {modalLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : modalList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
              <UserPlus className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {followModal === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
              </p>
            </div>
          ) : (
            modalList.map((u) => (
              <div key={u.id} className="flex items-start justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer border-b border-border/50">
                <div className="flex gap-3 flex-1 overflow-hidden mr-4">
                  <img
                    src={u.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"}
                    alt={u.full_name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[15px] hover:underline truncate leading-tight">
                      <Link href={`/profile?id=${u.id}`} onClick={() => setFollowModal(null)}>{u.full_name || 'User'}</Link>
                    </span>
                    <span className="text-[15px] text-muted-foreground truncate leading-tight">@{u.username || 'user'}</span>
                    {u.bio && <p className="text-[14px] mt-1 line-clamp-2 text-muted-foreground">{u.bio}</p>}
                  </div>
                </div>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleToggleFollow(u.id)}
                    disabled={!!followingInProgress[u.id]}
                    className={`shrink-0 px-4 py-1.5 rounded-full font-bold text-[14px] mt-1 transition-all flex items-center gap-1.5 ${
                      followingMap[u.id]
                        ? 'border border-border hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-foreground'
                        : 'bg-foreground text-background hover:opacity-90'
                    }`}
                  >
                    {followingInProgress[u.id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : followingMap[u.id] ? (
                      <><UserMinus className="w-3.5 h-3.5" /> Unfollow</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5" /> Follow</>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ─── Main Profile View ───────────────────────────────────────────────────────
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

      {/* Profile Card Module */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden mx-4 mt-4 shadow-sm pb-4">
        {/* Banner & Avatar */}
        <div>
          <div className="relative w-full aspect-[3/1] bg-slate-200 dark:bg-slate-800">
            <img src={profile?.banner_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800"} alt="Banner" className="w-full h-full object-cover" />

            <div className="absolute -bottom-16 left-4 rounded-full border-4 border-card bg-slate-200">
              <img src={profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"} alt="Avatar" className="w-32 h-32 rounded-full object-cover" />
            </div>
          </div>

          <div className="flex justify-end items-start gap-4 pt-3 px-4 h-[72px]">
            {isOwnProfile ? (
              <>
                <div className="flex flex-col gap-1.5 min-w-[140px] bg-slate-50 dark:bg-[#16181c] px-3 py-2 rounded-xl border border-border hidden sm:flex">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                    <span className="text-muted-foreground">Pitches</span>
                    <span className="text-indigo-500">{pitches.length} / {profile?.available_pitches ?? 3}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((pitches.length / Math.max(1, profile?.available_pitches ?? 3)) * 100, 100)}%` }}></div>
                  </div>
                </div>
                <Link href="/profile/edit" className="px-4 py-1.5 border border-border rounded-full font-bold hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors text-[15px] h-fit shrink-0">
                  Edit profile
                </Link>
              </>
            ) : (
              <button
                onClick={async () => {
                  if (!currentUserId || followingViewed) return;
                  setFollowingViewed(true);
                  if (isFollowingViewed) {
                    await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', viewedId!);
                    setIsFollowingViewed(false);
                    setFollowersCount(c => Math.max(0, c - 1));
                  } else {
                    await supabase.from('follows').insert({ follower_id: currentUserId, following_id: viewedId });
                    setIsFollowingViewed(true);
                    setFollowersCount(c => c + 1);
                    // Notify
                    await supabase.from('notifications').insert({
                      user_id: viewedId,
                      sender_id: currentUserId,
                      type: 'follow',
                      message: `Someone started following you.`,
                      link: '/profile',
                    });
                  }
                  setFollowingViewed(false);
                }}
                className={`px-5 py-1.5 rounded-full font-bold text-[15px] h-fit shrink-0 transition-all ${
                  isFollowingViewed
                    ? 'border border-border text-foreground hover:border-rose-400 hover:text-rose-500'
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                {followingViewed ? '...' : isFollowingViewed ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 pt-3 flex flex-col sm:flex-row sm:justify-between items-start gap-4">
          <div className="flex flex-col max-w-lg">
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-extrabold leading-tight">{profile?.full_name || "New User"}</h1>
            </div>
            <span className="text-[15px] text-muted-foreground">{profile?.username ? `@${profile.username}` : ""}</span>

            <div className="mt-3 text-[15px] leading-snug">
              {profile?.bio || "This user hasn't written a bio yet."}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0 sm:mt-1">
            {/* Real follow counts – clickable */}
            <div className="flex gap-5 text-[14px]">
              <button onClick={() => openFollowModal('following')} className="hover:underline cursor-pointer text-left">
                <strong className="text-foreground">{followingCount.toLocaleString()}</strong>{' '}
                <span className="text-muted-foreground">Following</span>
              </button>
              <button onClick={() => openFollowModal('followers')} className="hover:underline cursor-pointer text-left">
                <strong className="text-foreground">{followersCount.toLocaleString()}</strong>{' '}
                <span className="text-muted-foreground">Followers</span>
              </button>
            </div>

            <div className="flex flex-wrap sm:justify-end gap-x-4 gap-y-2 mt-1 text-[13px] text-muted-foreground">
              {profile?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Joined Recently
              </div>
            </div>
          </div>
        </div>

        {/* Pitch Database / Stats */}
        <div className="mx-4 mt-2 mb-4 p-4 bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl flex gap-4 overflow-x-auto hide-scrollbar relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
          
          <div className="flex-1 min-w-[100px] z-10">
             <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Pitches Posted</div>
             <div className="text-2xl font-black text-foreground">{pitches.length}</div>
          </div>
          
          {isOwnProfile && (
            <>
              <div className="w-px bg-border shrink-0 z-10"></div>
              <div className="flex-1 min-w-[100px] z-10">
                 <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Purchased</div>
                 <div className="text-2xl font-black text-foreground">{profile?.purchased_pitches ?? 0}</div>
              </div>
              <div className="w-px bg-border shrink-0 z-10"></div>
              <div className="flex-1 min-w-[100px] z-10">
                 <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Remaining</div>
                 <div className="text-2xl font-black text-foreground">{Math.max(0, (profile?.available_pitches ?? 3) - pitches.length)}</div>
              </div>
            </>
          )}

          <div className="w-px bg-border shrink-0 z-10"></div>
          <div className="flex-1 min-w-[100px] z-10">
             <div className="text-[11px] font-bold text-violet-500 uppercase tracking-wider mb-0.5">Followers</div>
             <div className="text-2xl font-black text-foreground">{followersCount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-border overflow-x-auto hide-scrollbar sticky top-[52px] z-10 bg-background/80 backdrop-blur-md mt-2">
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

      {/* Feed Content */}
      <div className="w-full bg-slate-50/50 dark:bg-[#16181c] min-h-screen">
        {pitches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No pitches added yet.
          </div>
        ) : (
          <div className="flex flex-col p-4 gap-6">
            {pitches.map((pitch) => (
              <div key={pitch.id} className="w-full border border-border rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
                
                {/* Card Banner */}
                <div className="w-full aspect-[3/1] bg-slate-200 dark:bg-slate-800 relative">
                  {pitch.cover_banner_url && <img src={pitch.cover_banner_url} className="w-full h-full object-cover" />}
                  <div className="absolute -bottom-8 left-4 w-16 h-16 bg-slate-300 dark:bg-slate-700 rounded-full border-4 border-card flex items-center justify-center overflow-hidden text-xl font-bold">
                    {pitch.profiles?.avatar_url ? (
                      <img src={pitch.profiles.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80" className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  {/* Persona Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[11px] font-bold uppercase tracking-wider">
                    {pitch.persona_type === 'job_seeker' ? 'Job Seeker' : pitch.persona_type === 'freelancer' ? 'Freelancer' : 'Influencer'}
                  </div>
                </div>

                <div className="p-4 pt-10 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-lg leading-tight hover:underline cursor-pointer">{pitch.full_name}</h4>
                        <span className="text-muted-foreground text-[14px]">@{pitch.profiles?.username || 'user'}</span>
                      </div>
                      <p className="text-[14px] leading-tight text-muted-foreground mt-0.5">{pitch.tagline}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-[13px] font-medium">
                    <span className="text-indigo-500 font-bold">
                      {pitch.persona_type === 'job_seeker' ? 'Open to hire' : pitch.persona_type === 'freelancer' ? 'Available for projects' : 'Open for collabs'}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{pitch.location} - {pitch.industry}</span>
                  </div>

                  {pitch.skills && pitch.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {pitch.skills.map((skill: string, i: number) => skill.trim() && (
                        <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-md">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {pitch.portfolio_link && (
                    <div className="mt-3">
                      <a href={pitch.portfolio_link.startsWith('http') ? pitch.portfolio_link : `https://${pitch.portfolio_link}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[13px] text-indigo-500 hover:underline font-medium" onClick={e => e.stopPropagation()}>
                        <LinkIcon className="w-4 h-4" /> {pitch.portfolio_link}
                      </a>
                    </div>
                  )}

                  <div className="flex gap-4 mt-4 flex-wrap">
                    <button 
                      onClick={() => setSelectedPitch(pitch)}
                      className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white transition-colors rounded-lg font-bold text-[14px] min-w-[140px]"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handleToggleLike(pitch.id, pitch.liked_by || [])}
                      className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg font-bold text-[14px] transition-colors ${
                        (pitch.liked_by || []).includes(currentUserId) 
                          ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/30' 
                          : 'bg-background border-border hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${(pitch.liked_by || []).includes(currentUserId) ? 'fill-current' : ''}`} />
                      {(pitch.liked_by || []).length > 0 ? (pitch.liked_by || []).length + ' ' : ''}Like{(pitch.liked_by || []).length !== 1 && (pitch.liked_by || []).length > 0 ? 's' : ''}
                    </button>
                    {isOwnProfile && (
                      <>
                        <Link href={`/publish?edit=${pitch.id}`} className="px-4 py-2 bg-transparent border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg font-bold text-[14px] flex items-center justify-center">
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDeletePitch(pitch.id)}
                          className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors rounded-lg font-bold text-[14px]"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleShareProfile(profile?.username)}
                      className="px-4 py-2 bg-transparent border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg font-bold text-[14px]"
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Pitch Modal */}
      {selectedPitch && (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto">
          <div className="bg-background w-full max-w-5xl h-fit min-h-[600px] rounded-2xl border border-border shadow-2xl relative mb-8 flex flex-col md:flex-row overflow-hidden">
            
            <button onClick={() => setSelectedPitch(null)} className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
              <X className="w-5 h-5" />
            </button>

            {/* Left Column - Main Content */}
            <div className="flex-1 flex flex-col border-r border-border bg-background">
              {/* Modal Banner */}
              <div className="w-full aspect-[3/1] bg-slate-200 dark:bg-slate-800 relative shrink-0">
                {selectedPitch.cover_banner_url && <img src={selectedPitch.cover_banner_url} className="w-full h-full object-cover" />}
                <div className="absolute -bottom-10 left-6 w-24 h-24 bg-slate-300 dark:bg-slate-700 rounded-full border-[6px] border-background flex items-center justify-center overflow-hidden text-2xl font-bold">
                  {selectedPitch.profiles?.avatar_url ? (
                    <img src={selectedPitch.profiles.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>

              <div className="p-6 pt-14 flex flex-col gap-1 flex-1">
                <h4 className="font-extrabold text-3xl leading-tight">{selectedPitch.full_name}</h4>
                <p className="text-xl leading-tight text-foreground/90 font-medium mt-1">{selectedPitch.tagline}</p>
                
                <div className="flex items-center gap-2 mt-2 text-[15px] font-medium">
                  <span className="text-indigo-500 font-bold">
                    {selectedPitch.persona_type === 'job_seeker' ? 'Open to hire' : selectedPitch.persona_type === 'freelancer' ? 'Available for projects' : 'Open for collabs'}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{selectedPitch.location} - {selectedPitch.industry}</span>
                </div>

                {selectedPitch.portfolio_link && (
                  <div className="mt-4">
                    <a href={selectedPitch.portfolio_link.startsWith('http') ? selectedPitch.portfolio_link : `https://${selectedPitch.portfolio_link}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[14px] text-indigo-500 hover:underline font-medium">
                      <LinkIcon className="w-4 h-4" /> {selectedPitch.portfolio_link}
                    </a>
                  </div>
                )}

                {selectedPitch.portfolio_images && selectedPitch.portfolio_images.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-bold text-lg mb-3">Portfolio Showcase</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedPitch.portfolio_images.map((img: string, idx: number) => img && (
                        <div key={idx} className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-border">
                          <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-auto pt-8 pb-2">
                  <button className="flex-1 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white transition-colors rounded-xl font-bold text-[16px] shadow-lg shadow-indigo-500/20">
                    {selectedPitch.persona_type === 'job_seeker' ? 'Apply now' : selectedPitch.persona_type === 'freelancer' ? 'Hire for project' : 'Request collab'}
                  </button>
                  <button 
                    onClick={() => handleToggleLike(selectedPitch.id, selectedPitch.liked_by || [])}
                    className={`flex items-center gap-1.5 justify-center px-5 py-3.5 border rounded-xl font-bold text-[16px] transition-colors ${
                      (selectedPitch.liked_by || []).includes(currentUserId) 
                        ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/30' 
                        : 'bg-background border-border hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${(selectedPitch.liked_by || []).includes(currentUserId) ? 'fill-current' : ''}`} />
                    {(selectedPitch.liked_by || []).length > 0 ? (selectedPitch.liked_by || []).length + ' ' : ''}Like{(selectedPitch.liked_by || []).length !== 1 && (selectedPitch.liked_by || []).length > 0 ? 's' : ''}
                  </button>
                  <button 
                    onClick={() => handleShareProfile(profile?.username)}
                    className="px-5 py-3.5 bg-transparent border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-xl font-bold text-[16px]"
                  >
                    Share
                  </button>
                  {isOwnProfile && (
                    <Link href={`/publish?edit=${selectedPitch.id}`} className="px-6 py-3.5 bg-transparent border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-xl font-bold text-[16px] flex items-center justify-center">
                      Edit Pitch
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="w-full md:w-[350px] bg-slate-50/50 dark:bg-[#16181c]/50 flex flex-col p-6 overflow-y-auto">
              
              {selectedPitch.about && (
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3">About</h3>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-muted-foreground">{renderFormattedText(selectedPitch.about)}</p>
                </div>
              )}

              {selectedPitch.skills && selectedPitch.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPitch.skills.map((skill: string, i: number) => skill.trim() && (
                      <span key={i} className="px-3 py-1.5 bg-slate-200/50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[13px] font-bold rounded-lg border border-border/50">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-lg mb-3">Details</h3>
                <div className="flex flex-col gap-3">
                  {selectedPitch.persona_type === 'job_seeker' && (
                    <>
                      <div className="bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3.5 flex flex-col justify-center">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Desired job title</span>
                        <span className="font-bold text-[15px] mt-1">{selectedPitch.desired_job_title}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3.5 flex flex-col justify-center">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Experience</span>
                        <span className="font-bold text-[15px] mt-1">{selectedPitch.experience_level}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3.5 flex flex-col justify-center">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Notice Period</span>
                        <span className="font-bold text-[15px] mt-1">{selectedPitch.notice_period || 'Immediate'}</span>
                      </div>
                      {selectedPitch.expected_salary && (
                         <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-3.5 flex flex-col justify-center">
                           <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">Expected Salary</span>
                           <span className="font-bold text-[15px] text-indigo-700 dark:text-indigo-300 mt-1">₹{selectedPitch.expected_salary.toLocaleString()} / mo</span>
                         </div>
                      )}
                    </>
                  )}
                  {selectedPitch.persona_type === 'freelancer' && (
                    <>
                      <div className="bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3.5 flex flex-col justify-center">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Turnaround</span>
                        <span className="font-bold text-[15px] mt-1">{selectedPitch.turnaround_time}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3.5 flex flex-col justify-center">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Availability</span>
                        <span className="font-bold text-[15px] mt-1">{selectedPitch.hours_available} hrs/wk</span>
                      </div>
                      {selectedPitch.hourly_rate && (
                         <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-3.5 flex flex-col justify-center">
                           <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">Hourly Rate</span>
                           <span className="font-bold text-[15px] text-indigo-700 dark:text-indigo-300 mt-1">₹{selectedPitch.hourly_rate.toLocaleString()} / hr</span>
                         </div>
                      )}
                    </>
                  )}
                  {selectedPitch.persona_type === 'influencer' && (
                    <>
                      <div className="bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3.5 flex flex-col justify-center">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Content niche</span>
                        <span className="font-bold text-[15px] mt-1">{selectedPitch.content_niche}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3.5 flex flex-col justify-center">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Social Followers</span>
                        <span className="font-bold text-[15px] mt-1">{selectedPitch.followers_count}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3.5 flex flex-col justify-center">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Engagement Rate</span>
                        <span className="font-bold text-[15px] mt-1">{selectedPitch.engagement_rate || 'N/A'}</span>
                      </div>
                       {selectedPitch.rate_per_post && (
                         <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-3.5 flex flex-col justify-center">
                           <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">Rate per Post</span>
                           <span className="font-bold text-[15px] text-indigo-700 dark:text-indigo-300 mt-1">₹{selectedPitch.rate_per_post.toLocaleString()}</span>
                         </div>
                       )}
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
