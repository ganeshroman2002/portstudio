"use client";
import React, { useState, useEffect } from "react";
import { Briefcase, Wrench, Sparkles, Image as ImageIcon, Plus, ArrowLeft, Loader2, X, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import imageCompression from "browser-image-compression";

export default function PublishPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'job_seeker' | 'freelancer' | 'influencer'>('job_seeker');
  const [loading, setLoading] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

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

  // Form State
  const [formData, setFormData] = useState<any>({
    cover_banner_url: "",
    full_name: "",
    tagline: "",
    industry: "Technology",
    location: "",
    skills: [],
    about: "",
    portfolio_images: ["", "", "", ""],
    
    // Job Seeker
    desired_job_title: "",
    experience_level: "Entry level",
    notice_period: "",
    expected_salary: 50000,
    
    // Freelancer
    turnaround_time: "",
    hours_available: 20,
    portfolio_link: "",
    hourly_rate: 800,
    
    // Influencer
    content_niche: "",
    followers_count: "",
    engagement_rate: "",
    rate_per_post: 15000,
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserSession(user);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setUserProfile(data);
          setFormData((prev: any) => ({
            ...prev,
            full_name: data.full_name || "",
            location: data.location || "",
            about: data.bio || "",
            cover_banner_url: data.banner_url || ""
          }));
        }
      }
    };
    fetchUser();
  }, []);

  const handlePublish = async () => {
    if (!userSession) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('talent_pitches').insert({
        profile_id: userSession.id,
        persona_type: activeTab,
        cover_banner_url: formData.cover_banner_url,
        full_name: formData.full_name,
        tagline: formData.tagline,
        industry: formData.industry,
        location: formData.location,
        skills: formData.skills,
        about: formData.about,
        portfolio_images: formData.portfolio_images.filter(Boolean),
        
        desired_job_title: formData.desired_job_title,
        experience_level: formData.experience_level,
        notice_period: formData.notice_period,
        expected_salary: formData.expected_salary,
        
        turnaround_time: formData.turnaround_time,
        hours_available: formData.hours_available,
        portfolio_link: formData.portfolio_link,
        hourly_rate: formData.hourly_rate,
        
        content_niche: formData.content_niche,
        followers_count: formData.followers_count,
        engagement_rate: formData.engagement_rate,
        rate_per_post: formData.rate_per_post,
      });

      if (error) throw error;
      
      router.push('/');
    } catch (error: any) {
      alert("Error publishing pitch: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number | 'banner') => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const { error: uploadError } = await supabase.storage.from('portfolios').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('portfolios').getPublicUrl(fileName);
      
      if (index === 'banner') {
        setFormData({ ...formData, cover_banner_url: data.publicUrl });
      } else {
        const newImages = [...formData.portfolio_images];
        newImages[index] = data.publicUrl;
        setFormData({ ...formData, portfolio_images: newImages });
      }
    } catch (error: any) {
      alert("Error uploading image: " + error.message);
    }
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !formData.skills.includes(val)) {
        setFormData({ ...formData, skills: [...formData.skills, val] });
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s: string) => s !== skillToRemove)
    });
  };

  return (
    <div className="w-full flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-6 border-b border-border">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold leading-tight">Create Pitch</h2>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: FORM */}
        <div className="w-full lg:w-[500px] xl:w-[600px] border-r border-border overflow-y-auto hide-scrollbar flex flex-col">
          
          {/* Tabs */}
          <div className="flex p-4 gap-2">
            <button 
              onClick={() => setActiveTab('job_seeker')}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'job_seeker' ? 'bg-slate-800 text-white border border-slate-700' : 'border border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Briefcase className="w-4 h-4" /> Job seeker
            </button>
            <button 
              onClick={() => setActiveTab('freelancer')}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'freelancer' ? 'bg-indigo-600 text-white border border-indigo-500' : 'border border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Wrench className="w-4 h-4" /> Freelancer
            </button>
            <button 
              onClick={() => setActiveTab('influencer')}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'influencer' ? 'bg-blue-600 text-white border border-blue-500' : 'border border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Sparkles className="w-4 h-4" /> Influencer
            </button>
          </div>

          <div className="p-4 flex flex-col gap-6 pb-20">
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-bold mb-2">Cover banner</label>
              <label className="w-full aspect-[3/1] border border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors overflow-hidden">
                {formData.cover_banner_url ? (
                  <img src={formData.cover_banner_url} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Add cover banner</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'banner')} />
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Full name</label>
              <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="Aarav Sharma" />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">Tagline</label>
              <input type="text" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="Frontend developer who loves clean UI" />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold mb-2">Industry</label>
                <select value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                  <option>Technology</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Finance</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold mb-2">Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="Mumbai, India" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Skills and tags (Press Enter or Comma to add)</label>
              <div className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg p-2 flex flex-wrap gap-2 items-center focus-within:border-indigo-500 transition-colors">
                {formData.skills.map((skill: string, index: number) => (
                  <div key={index} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md text-sm font-medium">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-indigo-900 dark:hover:text-indigo-100 text-indigo-500/70 focus:outline-none">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <input 
                  type="text" 
                  value={skillInput} 
                  onChange={e => setSkillInput(e.target.value)} 
                  onKeyDown={handleSkillKeyDown}
                  className="flex-1 min-w-[120px] bg-transparent border-none text-sm focus:outline-none p-1" 
                  placeholder={formData.skills.length === 0 ? "React, Node.js, UI/UX" : ""} 
                />
              </div>
            </div>

            {/* Persona Specific Fields */}
            {activeTab === 'job_seeker' && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-2">Desired job title</label>
                  <input type="text" value={formData.desired_job_title} onChange={e => setFormData({...formData, desired_job_title: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="Frontend developer" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Experience level</label>
                  <select value={formData.experience_level} onChange={e => setFormData({...formData, experience_level: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                    <option>Entry level</option>
                    <option>Mid level</option>
                    <option>Senior level</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Notice period</label>
                  <input type="text" value={formData.notice_period} onChange={e => setFormData({...formData, notice_period: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="30 days" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold">Expected monthly salary</label>
                    <span className="font-bold">₹{formData.expected_salary.toLocaleString()}</span>
                  </div>
                  <input type="range" min="10000" max="500000" step="5000" value={formData.expected_salary} onChange={e => setFormData({...formData, expected_salary: Number(e.target.value)})} className="w-full accent-indigo-500" />
                </div>
              </>
            )}

            {activeTab === 'freelancer' && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-2">Typical turnaround</label>
                  <input type="text" value={formData.turnaround_time} onChange={e => setFormData({...formData, turnaround_time: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="3-5 days" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Hours available per week</label>
                  <input type="number" value={formData.hours_available} onChange={e => setFormData({...formData, hours_available: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="20" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Portfolio link</label>
                  <input type="text" value={formData.portfolio_link} onChange={e => setFormData({...formData, portfolio_link: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="behance.net/yourname" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold">Hourly rate</label>
                    <span className="font-bold">₹{formData.hourly_rate.toLocaleString()}</span>
                  </div>
                  <input type="range" min="100" max="10000" step="100" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: Number(e.target.value)})} className="w-full accent-indigo-500" />
                </div>
              </>
            )}

            {activeTab === 'influencer' && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-2">Content niche</label>
                  <input type="text" value={formData.content_niche} onChange={e => setFormData({...formData, content_niche: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="Fitness and lifestyle" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Followers</label>
                  <input type="text" value={formData.followers_count} onChange={e => setFormData({...formData, followers_count: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="42K" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Engagement rate</label>
                  <input type="text" value={formData.engagement_rate} onChange={e => setFormData({...formData, engagement_rate: e.target.value})} className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="4.8%" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold">Rate per post</label>
                    <span className="font-bold">₹{formData.rate_per_post.toLocaleString()}</span>
                  </div>
                  <input type="range" min="500" max="100000" step="500" value={formData.rate_per_post} onChange={e => setFormData({...formData, rate_per_post: Number(e.target.value)})} className="w-full accent-indigo-500" />
                </div>
              </>
            )}

            {/* Portfolio Showcase */}
            <div>
              <label className="block text-sm font-bold mb-2">Portfolio showcase</label>
              <div className="flex gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <label key={idx} className="flex-1 aspect-square border border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors overflow-hidden relative">
                    {formData.portfolio_images[idx] ? (
                      <>
                        <img src={formData.portfolio_images[idx]} className="w-full h-full object-cover" />
                        <div onClick={(e) => {
                          e.preventDefault();
                          const newImages = [...formData.portfolio_images];
                          newImages[idx] = "";
                          setFormData({ ...formData, portfolio_images: newImages });
                        }} className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <X className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx)} />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">About this pitch / Info</label>
              <textarea 
                value={formData.about} 
                onChange={e => setFormData({...formData, about: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-[#16181c] border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none h-28" 
                placeholder="Include hashtags (#) or tag people/companies (@) to showcase your experience." 
              />
            </div>

            <button 
              onClick={handlePublish}
              disabled={loading || !formData.full_name}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish post →"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW */}
        <div className="hidden lg:block flex-1 bg-slate-50/50 dark:bg-background overflow-y-auto p-8 hide-scrollbar">
          <h3 className="font-bold text-[15px] mb-4">Live preview</h3>
          
          <div className="w-full max-w-sm border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
            {/* Card Banner */}
            <div className="w-full aspect-[3/1] bg-slate-200 dark:bg-slate-800 relative">
              {formData.cover_banner_url && <img src={formData.cover_banner_url} className="w-full h-full object-cover" />}
              <div className="absolute -bottom-8 left-4 w-16 h-16 bg-slate-300 dark:bg-slate-700 rounded-full border-4 border-card flex items-center justify-center overflow-hidden text-xl font-bold">
                <img src={userProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="p-4 pt-10 flex flex-col gap-1">
              <h4 className="font-extrabold text-lg leading-tight">{formData.full_name || "Your name"}</h4>
              <p className="text-[14px] leading-tight text-muted-foreground">{formData.tagline || "Your one-line pitch appears here"}</p>
              
              <div className="flex items-center gap-2 mt-1 text-[13px] font-medium">
                <span className="text-foreground">
                  {activeTab === 'job_seeker' ? 'Open to hire' : activeTab === 'freelancer' ? 'Available for projects' : 'Open for collabs'}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{formData.location || "Location"} - {formData.industry || "Technology"}</span>
              </div>
              
              <div className="mt-6">
                <h4 className="font-bold text-[14px] mb-2 border-b border-border pb-1">About</h4>
                <p className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {renderFormattedText(formData.about) || "No details provided"}
                </p>
              </div>

              {formData.skills && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.skills.length > 0 ? (
                    formData.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[13px] font-medium rounded-full">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[13px] font-medium rounded-full text-muted-foreground">
                      Skills will appear here
                    </span>
                  )}
                </div>
              )}
              
              {formData.portfolio_link && (
                <div className="mt-3">
                  <a href={formData.portfolio_link.startsWith('http') ? formData.portfolio_link : `https://${formData.portfolio_link}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[13px] text-indigo-500 hover:underline font-medium">
                    <LinkIcon className="w-4 h-4" /> {formData.portfolio_link}
                  </a>
                </div>
              )}

              {/* Showcase thumbnails */}
              <div className="flex gap-2 mt-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="flex-1 aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-border/50">
                    {formData.portfolio_images[idx] && <img src={formData.portfolio_images[idx]} className="w-full h-full object-cover" />}
                  </div>
                ))}
              </div>

              {/* Stats / Badges */}
              <div className="flex gap-2 mt-4">
                {activeTab === 'job_seeker' && (
                  <>
                    <div className="flex-1 bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase">Desired job title</span>
                      <span className="font-bold text-[14px] leading-tight mt-0.5 truncate">{formData.desired_job_title || "Frontend developer"}</span>
                    </div>
                    <div className="w-[100px] bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3 flex flex-col justify-center shrink-0">
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase">Experience level</span>
                      <span className="font-bold text-[14px] leading-tight mt-0.5 truncate">{formData.experience_level || "Entry level"}</span>
                    </div>
                  </>
                )}
                {activeTab === 'freelancer' && (
                  <>
                    <div className="flex-1 bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase">Typical turnaround</span>
                      <span className="font-bold text-[14px] leading-tight mt-0.5 truncate">{formData.turnaround_time || "3-5 days"}</span>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase">Hours available per week</span>
                      <span className="font-bold text-[14px] leading-tight mt-0.5 truncate">{formData.hours_available ? `${formData.hours_available} hrs` : "20 hrs"}</span>
                    </div>
                  </>
                )}
                {activeTab === 'influencer' && (
                  <>
                    <div className="flex-1 bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase">Content niche</span>
                      <span className="font-bold text-[14px] leading-tight mt-0.5 truncate">{formData.content_niche || "Fitness and lifestyle"}</span>
                    </div>
                    <div className="w-[100px] bg-slate-50 dark:bg-[#16181c] border border-border rounded-xl p-3 flex flex-col justify-center shrink-0">
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase">Followers</span>
                      <span className="font-bold text-[14px] leading-tight mt-0.5 truncate">{formData.followers_count || "42K"}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Button */}
              <button className="w-full mt-4 py-2.5 bg-transparent border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg font-bold text-[14px]">
                {activeTab === 'job_seeker' ? 'Apply now' : activeTab === 'freelancer' ? 'Hire for project' : 'Request collab'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
