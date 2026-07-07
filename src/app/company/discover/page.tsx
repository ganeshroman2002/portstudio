"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Plus, Link as LinkIcon, Code, X, ImageIcon, AlertCircle, Sparkles, Search, MoreHorizontal, ArrowLeft, LayoutGrid, List } from "lucide-react";
import { createClient } from "@/lib/client";
import Link from "next/link";

export default function HomeFeedPage() {
  const supabase = createClient();
  const [pitches, setPitches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedPitch, setSelectedPitch] = useState<any>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  // Messaging Modal State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Interview Modal State
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedPitch || !userProfile || !userProfile.id) return;
    
    if (/(?:^|\s)@interview(?:\s|$)/i.test(messageText)) {
      setShowInterviewModal(true);
      return;
    }
    
    setSendingMessage(true);
    
    // 1. Find or create conversation
    let conversationId = null;
    
    const { data: existingConv, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant1_id.eq.${userProfile.id},participant2_id.eq.${selectedPitch.profile_id}),and(participant1_id.eq.${selectedPitch.profile_id},participant2_id.eq.${userProfile.id})`)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(fetchError);
      alert(`Database error. Did you run the SQL script? ${fetchError.message}`);
      setSendingMessage(false);
      return;
    }
      
    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({ participant1_id: userProfile.id, participant2_id: selectedPitch.profile_id })
        .select()
        .single();
        
      if (newConvError) {
        alert(`Failed to create conversation. Did you run the SQL script? ${newConvError.message}`);
        setSendingMessage(false);
        return;
      }
      if (newConv) conversationId = newConv.id;
    }
    
    if (conversationId) {
      // 2. Insert message using fresh auth user to guarantee RLS pass
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        content: messageText
      });
      
      if (msgError) {
        alert(`Failed to send message: ${msgError.message}`);
      } else {
        // 3. Send Notification to talent
        await supabase.from('notifications').insert({
          user_id: selectedPitch.profile_id,
          sender_id: user?.id,
          type: 'message',
          message: `${userProfile.full_name || 'A company'} sent you a new message.`,
          link: '/messages'
        });
        
        setMessageText("");
        setIsMessageModalOpen(false);
        alert("Message sent successfully!");
      }
    }
    setSendingMessage(false);
  };

  const handleScheduleInterview = async () => {
    if (!interviewDate || !selectedPitch || !userProfile || !userProfile.id) return;
    setSchedulingInterview(true);
    
    // 1. Find or create conversation
    let conversationId = null;
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant1_id.eq.${userProfile.id},participant2_id.eq.${selectedPitch.profile_id}),and(participant1_id.eq.${selectedPitch.profile_id},participant2_id.eq.${userProfile.id})`)
      .single();
      
    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant1_id: userProfile.id, participant2_id: selectedPitch.profile_id })
        .select()
        .single();
      if (newConv) conversationId = newConv.id;
    }

    if (conversationId) {
      const dateObj = new Date(interviewDate);
      
      const { error: interviewError } = await supabase.from('interviews').insert({
        company_id: userProfile.id,
        talent_id: selectedPitch.profile_id,
        conversation_id: conversationId,
        interview_date: dateObj.toISOString(),
        status: 'scheduled'
      });
      
      if (!interviewError) {
        const autoMsg = `🗓️ I have scheduled an interview with you for ${dateObj.toLocaleString()}. Please check your Schedule for details.`;
        
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: userProfile.id,
          content: autoMsg
        });
        
        await supabase.from('notifications').insert({
          user_id: selectedPitch.profile_id,
          sender_id: userProfile.id,
          type: 'interview',
          message: `${userProfile.full_name || 'A company'} scheduled an interview with you!`,
          link: '/schedule'
        });

        alert("Interview scheduled successfully!");
        setShowInterviewModal(false);
        setInterviewDate("");
        if (isMessageModalOpen) setIsMessageModalOpen(false);
      } else {
        alert("Failed to schedule interview: " + interviewError.message);
      }
    }
    setSchedulingInterview(false);
  };

  const fetchPitches = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile({ id: user.id, ...p, role: user.user_metadata?.role || p?.account_type });
      
      const { data: users } = await supabase.from('profiles').select('*').neq('id', user.id).limit(3);
      if (users) setSuggestedUsers(users);
    }

    const { data, error } = await supabase
      .from('talent_pitches')
      .select('*, profiles(full_name, username, avatar_url)')
      .order('created_at', { ascending: false });

    if (data) setPitches(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPitches();
    const savedMode = localStorage.getItem('portstudio_view_mode') as 'grid' | 'list';
    if (savedMode) setViewMode(savedMode);

    const handleViewModeChange = (e: any) => {
      if (e.detail) setViewMode(e.detail);
    };
    window.addEventListener('viewModeChanged', handleViewModeChange);
    return () => window.removeEventListener('viewModeChanged', handleViewModeChange);
  }, []);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('portstudio_view_mode', mode);
    window.dispatchEvent(new CustomEvent('viewModeChanged', { detail: mode }));
  };

  const handleShareProfile = (username: string | undefined) => {
    if (!username) {
      alert('User does not have a public profile yet.');
      return;
    }
    const url = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(url);
    alert('Profile link copied to clipboard!');
  };

  return (
    <div className="flex w-full h-full relative">
      {/* Center Column (Feed or Pitch Main Content) */}
      <div className="flex-1 max-w-[600px] border-r border-border h-full overflow-y-auto hide-scrollbar flex flex-col relative bg-background">
        
        {!selectedPitch ? (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border">
              <h2 className="text-xl font-bold leading-tight cursor-pointer">Home</h2>
              <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1">
                <button onClick={() => handleSetViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => handleSetViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>


            {/* Feed Content */}
            <div className="w-full bg-slate-50/50 dark:bg-[#16181c] min-h-screen">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : pitches.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No pitches found. Be the first to publish one!
                </div>
              ) : (
                <div className="flex flex-col p-4 gap-6 pb-24">
                  {pitches.map((pitch) => {
                    const p = Array.isArray(pitch.profiles) ? pitch.profiles[0] : pitch.profiles;
                    
                    if (viewMode === 'list') {
                      return (
                        <div key={pitch.id} className="w-full flex items-center p-4 bg-slate-100 dark:bg-[#1e2128] rounded-[32px] border border-border shadow-sm hover:shadow-md transition-shadow gap-5">
                          {/* Profile Picture */}
                          <div className="w-[110px] h-[110px] shrink-0 rounded-full overflow-hidden shadow-sm">
                            {p?.avatar_url ? (
                              <img src={p.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80" className="w-full h-full object-cover" />
                            )}
                          </div>

                          {/* Info & Buttons container */}
                          <div className="flex flex-col flex-1 gap-3">
                            {/* Info block */}
                            <div className="bg-background dark:bg-[#13151a] rounded-2xl p-4 flex flex-col gap-1 border border-border/50">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-extrabold text-[16px] leading-tight hover:underline cursor-pointer">{pitch.full_name}</h4>
                                <span className="text-muted-foreground text-[13px]">@{p?.username || 'user'}</span>
                              </div>
                              <p className="text-[13px] leading-snug text-muted-foreground mt-0.5">{pitch.tagline}</p>
                              
                              <div className="flex items-center gap-2 mt-1.5 text-[12px] font-medium">
                                <span className="text-indigo-500 font-bold">
                                  {pitch.persona_type === 'job_seeker' ? 'Open to hire' : pitch.persona_type === 'freelancer' ? 'Available for projects' : 'Open for collabs'}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">{pitch.location} - {pitch.industry}</span>
                              </div>

                              {pitch.skills && pitch.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {pitch.skills.slice(0, 4).map((skill: string, i: number) => skill.trim() && (
                                    <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700">
                                      {skill.trim()}
                                    </span>
                                  ))}
                                  {pitch.skills.length > 4 && (
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700">
                                      +{pitch.skills.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                              <button
                                onClick={() => setSelectedPitch(pitch)}
                                className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white transition-colors rounded-2xl font-bold text-[14px]"
                              >
                                View Pitch Details
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleShareProfile(p?.username); }}
                                className="px-6 py-2 bg-background border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl font-bold text-[14px]"
                              >
                                Share
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={pitch.id} className="w-full border border-border rounded-3xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        {/* Card Banner */}
                        <div className="w-full h-[140px] sm:h-[180px] bg-slate-200 dark:bg-slate-800 relative shrink-0">
                          {pitch.cover_banner_url && <img src={pitch.cover_banner_url} className="w-full h-full object-cover" />}
                          
                          {/* Persona Badge */}
                          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-[12px] font-bold uppercase tracking-wider z-10">
                            {pitch.persona_type === 'job_seeker' ? 'Job Seeker' : pitch.persona_type === 'freelancer' ? 'Freelancer' : 'Influencer'}
                          </div>
                        </div>

                        {/* Overlapping Content Block */}
                        <div className="relative -mt-12 bg-card rounded-t-[32px] pt-4 px-4 pb-5 sm:pt-6 sm:px-6 sm:pb-6 flex flex-col gap-4 sm:gap-5 z-10 flex-1">
                          <div className="flex gap-4 sm:gap-6">
                            {/* Profile Picture */}
                            <div className="relative -mt-10 sm:-mt-14 shrink-0">
                              <div className="w-[84px] h-[84px] sm:w-[104px] sm:h-[104px] bg-slate-300 dark:bg-slate-700 rounded-full border-[6px] border-card flex items-center justify-center overflow-hidden shadow-sm">
                                {p?.avatar_url ? (
                                  <img src={p.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80" className="w-full h-full object-cover" />
                                )}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col flex-1 pt-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-extrabold text-[18px] sm:text-[20px] leading-tight hover:underline cursor-pointer">{pitch.full_name}</h4>
                                <span className="text-muted-foreground text-[14px] sm:text-[15px]">@{p?.username || 'user'}</span>
                              </div>
                              <p className="text-[14px] sm:text-[15px] leading-snug text-muted-foreground mt-1">{pitch.tagline}</p>
                              
                              <div className="flex items-center gap-2 mt-2.5 text-[13px] sm:text-[14px] font-medium">
                                <span className="text-indigo-500 font-bold">
                                  {pitch.persona_type === 'job_seeker' ? 'Open to hire' : pitch.persona_type === 'freelancer' ? 'Available for projects' : 'Open for collabs'}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">{pitch.location} - {pitch.industry}</span>
                              </div>

                              {pitch.skills && pitch.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {pitch.skills.slice(0, 4).map((skill: string, i: number) => skill.trim() && (
                                    <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-md border border-slate-200 dark:border-slate-700">
                                      {skill.trim()}
                                    </span>
                                  ))}
                                  {pitch.skills.length > 4 && (
                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-md border border-slate-200 dark:border-slate-700">
                                      +{pitch.skills.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}

                              {pitch.portfolio_link && (
                                <div className="mt-3.5">
                                  <a href={pitch.portfolio_link.startsWith('http') ? pitch.portfolio_link : `https://${pitch.portfolio_link}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[13px] sm:text-[14px] text-indigo-500 hover:underline font-medium w-fit" onClick={e => e.stopPropagation()}>
                                    <LinkIcon className="w-4 h-4" /> {pitch.portfolio_link}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Buttons (Full Width) */}
                          <div className="flex gap-3 sm:gap-4 mt-2">
                            <button
                              onClick={() => setSelectedPitch(pitch)}
                              className="flex-1 py-2 sm:py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white transition-colors rounded-xl sm:rounded-2xl font-bold text-[14px] sm:text-[15px]"
                            >
                              View Pitch Details
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleShareProfile(p?.username); }} className="px-5 sm:px-6 py-2 sm:py-2.5 bg-transparent border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-xl sm:rounded-2xl font-bold text-[14px] sm:text-[15px]">
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (() => {
          const modalProfile = Array.isArray(selectedPitch.profiles) ? selectedPitch.profiles[0] : selectedPitch.profiles;
          return (
            <>
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-6 cursor-pointer border-b border-border hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors" onClick={() => setSelectedPitch(null)}>
                <ArrowLeft className="w-5 h-5" />
                <h2 className="text-xl font-bold leading-tight">Post</h2>
              </div>

              <div className="p-6 md:p-8 flex flex-col min-h-[100vh] pb-24">
                {/* Header (Avatar, Name, Username) */}
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-20 h-20 bg-slate-300 dark:bg-slate-700 rounded-full border-2 border-border flex items-center justify-center overflow-hidden shrink-0">
                    {modalProfile?.avatar_url ? (
                      <img src={modalProfile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-extrabold text-3xl leading-tight">{selectedPitch.full_name}</h4>
                    <span className="text-muted-foreground text-lg mt-0.5">@{modalProfile?.username || 'user'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-[15px] font-medium">
                  <span className="text-indigo-500 font-bold">
                    {selectedPitch.persona_type === 'job_seeker' ? 'Open to hire' : selectedPitch.persona_type === 'freelancer' ? 'Available for projects' : 'Open for collabs'}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{selectedPitch.location} - {selectedPitch.industry}</span>
                </div>

                <p className="text-xl leading-snug text-foreground/90 font-medium mb-8">{selectedPitch.tagline}</p>

                {/* Images */}
                <div className="flex flex-col gap-6">
                  {selectedPitch.cover_banner_url && (
                    <div>
                      <h3 className="font-bold text-lg mb-3">Cover</h3>
                      <div 
                        className="w-full aspect-[21/9] bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden relative border border-border cursor-zoom-in"
                        onClick={() => setZoomedImage(selectedPitch.cover_banner_url)}
                      >
                        <img src={selectedPitch.cover_banner_url} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  {selectedPitch.portfolio_images && selectedPitch.portfolio_images.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg mb-3">Portfolio Showcase</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedPitch.portfolio_images.map((img: string, idx: number) => img && (
                          <div 
                            key={idx} 
                            className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-border cursor-zoom-in"
                            onClick={() => setZoomedImage(img)}
                          >
                            <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Right Sidebar Column */}
      <aside className="hidden lg:flex flex-col w-[350px] shrink-0 px-4 py-1 h-full overflow-y-auto hide-scrollbar">
        {!selectedPitch ? (
          <>
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

            {/* Company Stats Widget */}
            <div className="bg-slate-50 dark:bg-[#16181c] rounded-2xl border border-border overflow-hidden mb-4">
              <h2 className="px-4 pt-4 pb-3 text-[20px] font-extrabold border-b border-border">Company Overview</h2>
              <div className="grid grid-cols-2 gap-px bg-border">
                <div className="bg-slate-50 dark:bg-[#16181c] p-4 flex flex-col items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-default">
                  <span className="text-2xl font-black text-indigo-500">3</span>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center mt-1 text-balance leading-tight">Active Jobs</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#16181c] p-4 flex flex-col items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-default">
                  <span className="text-2xl font-black">12</span>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center mt-1 text-balance leading-tight">Saved Profiles</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#16181c] p-4 flex flex-col items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-default">
                  <span className="text-2xl font-black text-green-500">4</span>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center mt-1 text-balance leading-tight">Interviews Scheduled</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#16181c] p-4 flex flex-col items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-default">
                  <span className="text-2xl font-black">892</span>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center mt-1 text-balance leading-tight">Profile Views</span>
                </div>
              </div>
            </div>

            {/* You Might Like Widget */}
            <div className="bg-slate-50 dark:bg-[#16181c] rounded-2xl border border-border mb-4 pt-3 pb-1">
              <h2 className="px-4 text-[20px] font-extrabold mb-3">You might like</h2>
              
              {suggestedUsers.map((user, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <img src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold text-[15px] hover:underline">{user.full_name || 'User'}</span>
                      <span className="text-[15px] text-muted-foreground">{user.username ? `@${user.username}` : ''}</span>
                    </div>
                  </div>
                  <button className="bg-foreground text-background px-4 py-1.5 rounded-full font-bold text-[14px] hover:opacity-90 transition-opacity">
                    Follow
                  </button>
                </div>
              ))}
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
            
            <div className="pb-24"></div>
          </>
        ) : (() => {
          return (
            <div className="py-6 flex flex-col gap-6 min-h-screen">
              {selectedPitch.about && (
                <div>
                  <h3 className="font-bold text-lg mb-3">About</h3>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-muted-foreground">{selectedPitch.about}</p>
                </div>
              )}

              {selectedPitch.skills && selectedPitch.skills.length > 0 && (
                <div>
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
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Followers</span>
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

              {selectedPitch.portfolio_link && (
                <div className="pt-4 border-t border-border">
                  <a href={selectedPitch.portfolio_link.startsWith('http') ? selectedPitch.portfolio_link : `https://${selectedPitch.portfolio_link}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-slate-200/50 dark:bg-slate-800 text-[15px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors rounded-xl font-bold">
                    <LinkIcon className="w-4 h-4" /> View External Portfolio
                  </a>
                </div>
              )}

              <div className="pb-24">
                {true && (
                  <div className="flex flex-col gap-3 mt-6">
                    <button 
                      onClick={() => setShowInterviewModal(true)}
                      className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white transition-colors rounded-xl font-bold text-[15px] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                      Invite to Interview ⭐
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setIsMessageModalOpen(true)}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2128] dark:hover:bg-slate-800 border border-border text-foreground transition-colors rounded-xl font-bold text-[13px] flex items-center justify-center gap-2"
                      >
                        💬 Message
                      </button>
                      <button className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2128] dark:hover:bg-slate-800 border border-border text-foreground transition-colors rounded-xl font-bold text-[13px] flex items-center justify-center gap-2">
                        ⭐ Save Talent
                      </button>
                      <button className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2128] dark:hover:bg-slate-800 border border-border text-foreground transition-colors rounded-xl font-bold text-[13px] flex items-center justify-center gap-2">
                        🔖 Shortlist
                      </button>
                      <button className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2128] dark:hover:bg-slate-800 border border-border text-foreground transition-colors rounded-xl font-bold text-[13px] flex items-center justify-center gap-2">
                        👀 View Portfolio
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                      <button 
                        onClick={() => setShowInterviewModal(true)}
                        className="w-full py-2.5 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-muted-foreground transition-colors rounded-xl font-bold text-[14px] flex items-center justify-center gap-2"
                      >
                        📅 Schedule Interview
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleShareProfile(selectedPitch.profiles?.username || (Array.isArray(selectedPitch.profiles) ? selectedPitch.profiles[0]?.username : undefined)); }}
                        className="w-full py-2.5 bg-transparent border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground transition-colors rounded-xl font-bold text-[14px] flex items-center justify-center gap-2"
                      >
                        📤 Share Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </aside>

      {/* Fullscreen Image Zoom */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            alt="Full screen view" 
          />
        </div>
      )}
      
      {/* Messaging Modal */}
      {isMessageModalOpen && selectedPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsMessageModalOpen(false)}>
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsMessageModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1">Message {selectedPitch.full_name}</h3>
            <p className="text-[13px] text-muted-foreground mb-4">Start a conversation about their pitch.</p>
            
            <div className="relative">
              {/(?:^|\s)@$/.test(messageText) && (
                <div className="absolute bottom-full mb-2 left-0 w-56 bg-background border border-border rounded-xl shadow-lg p-1.5 flex flex-col z-20 animate-in fade-in slide-in-from-bottom-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowInterviewModal(true); setIsMessageModalOpen(false); setMessageText(""); }} 
                    className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left w-full"
                  >
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-md">
                      <span className="font-bold">📅</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[14px] leading-tight">Schedule Interview</span>
                      <span className="text-[11px] text-muted-foreground leading-tight">Pick a time to meet</span>
                    </div>
                  </button>
                </div>
              )}
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (/(?:^|\s)@$/.test(messageText) && (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ')) {
                    e.preventDefault();
                    setShowInterviewModal(true);
                    setIsMessageModalOpen(false);
                    setMessageText("");
                  }
                }}
                placeholder="Hi there, we loved your pitch... (Type @ for options)"
                className="w-full h-32 p-3 bg-slate-100 dark:bg-[#202327] rounded-xl border border-transparent focus:border-indigo-500 focus:bg-background focus:ring-1 focus:ring-indigo-500 transition-colors resize-none text-[14px]"
              />
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageText.trim()}
                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-[14px] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {sendingMessage && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
