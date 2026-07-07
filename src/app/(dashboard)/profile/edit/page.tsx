"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Save, Plus, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/client";
import imageCompression from "browser-image-compression";

const TABS = [
  "Basic Information",
  "Professional",
  "Portfolio",
  "Experience",
  "Education",
  "Social Links",
];

export default function EditProfilePage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  // Data States
  const [userSession, setUserSession] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<any>({});

  // Inline Form States
  const [showPortForm, setShowPortForm] = useState(false);
  const [portForm, setPortForm] = useState({ title: "", description: "", live_demo_url: "", github_url: "" });
  
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState({ company: "", position: "", duration: "", description: "" });
  
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduForm, setEduForm] = useState({ school: "", degree: "", duration: "", description: "" });

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserSession(user);
        
        // Fetch Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) setFormData(profile);
        
        // Fetch Portfolios
        const { data: ports } = await supabase.from('portfolios').select('*').eq('profile_id', user.id);
        if (ports) setPortfolios(ports);
        
        // Fetch Experiences
        const { data: exps } = await supabase.from('experiences').select('*').eq('profile_id', user.id);
        if (exps) setExperiences(exps);
        
        // Fetch Educations
        const { data: edus } = await supabase.from('educations').select('*').eq('profile_id', user.id);
        if (edus) setEducations(edus);
        
        // Fetch Social Links
        const { data: socials } = await supabase.from('social_links').select('*').eq('profile_id', user.id).single();
        if (socials) setSocialLinks(socials);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    if (userSession) {
      if (activeTab === "Basic Information" || activeTab === "Professional") {
        const { error } = await supabase.from('profiles').upsert({
          id: userSession.id,
          full_name: formData.full_name,
          username: formData.username,
          avatar_url: formData.avatar_url || undefined,
          banner_url: formData.banner_url || undefined,
          headline: formData.headline,
          bio: formData.bio,
          location: formData.location,
          availability: formData.availability,
          primary_category: formData.primary_category,
        });
        
        if (error) {
          if (error.message?.includes('profiles_username_key')) {
            alert("That username is already taken by someone else. Please choose a different username!");
          } else {
            alert("Error saving profile: " + error.message);
          }
        } else {
          alert("Profile saved successfully!");
        }
      }
      
      if (activeTab === "Social Links") {
        const { error } = await supabase.from('social_links').upsert({
          profile_id: userSession.id,
          linkedin: socialLinks.linkedin,
          x_twitter: socialLinks.x_twitter,
          instagram: socialLinks.instagram,
          youtube: socialLinks.youtube,
          website: socialLinks.website,
        });
        
        if (error) alert("Error saving social links: " + error.message);
        else alert("Social links saved successfully!");
      }
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setFormData({ ...formData, avatar_url: data.publicUrl });
    } catch (error: any) {
      alert("Error uploading image: " + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingBanner(true);
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

      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
      setFormData({ ...formData, banner_url: data.publicUrl });
    } catch (error: any) {
      alert("Error uploading banner: " + error.message);
    } finally {
      setUploadingBanner(false);
    }
  };

  // --- PORTFOLIO LOGIC ---
  const handleAddProjectClick = () => {
    if (portfolios.length >= 3) {
      alert("You have reached the maximum of 3 projects for the basic ₹49 tier. Please upgrade your plan to add more projects!");
      return;
    }
    setShowPortForm(true);
  };

  const savePortfolio = async () => {
    if (!portForm.title) return;
    const { data, error } = await supabase.from('portfolios').insert({
      profile_id: userSession.id,
      ...portForm
    }).select().single();
    
    if (error) {
      alert("Error adding project: " + error.message);
      return;
    }
    
    if (data) setPortfolios([...portfolios, data]);
    setShowPortForm(false);
    setPortForm({ title: "", description: "", live_demo_url: "", github_url: "" });
  };

  const deletePortfolio = async (id: string) => {
    await supabase.from('portfolios').delete().eq('id', id);
    setPortfolios(portfolios.filter(p => p.id !== id));
  };

  // --- EXPERIENCE LOGIC ---
  const saveExperience = async () => {
    if (!expForm.company || !expForm.position) return;
    const { data, error } = await supabase.from('experiences').insert({
      profile_id: userSession.id,
      ...expForm
    }).select().single();
    
    if (error) {
      alert("Error adding experience: " + error.message);
      return;
    }
    
    if (data) setExperiences([...experiences, data]);
    setShowExpForm(false);
    setExpForm({ company: "", position: "", duration: "", description: "" });
  };

  const deleteExperience = async (id: string) => {
    await supabase.from('experiences').delete().eq('id', id);
    setExperiences(experiences.filter(e => e.id !== id));
  };

  // --- EDUCATION LOGIC ---
  const saveEducation = async () => {
    if (!eduForm.school || !eduForm.degree) return;
    const { data, error } = await supabase.from('educations').insert({
      profile_id: userSession.id,
      ...eduForm
    }).select().single();
    
    if (error) {
      alert("Error adding education: " + error.message);
      return;
    }
    
    if (data) setEducations([...educations, data]);
    setShowEduForm(false);
    setEduForm({ school: "", degree: "", duration: "", description: "" });
  };

  const deleteEducation = async (id: string) => {
    await supabase.from('educations').delete().eq('id', id);
    setEducations(educations.filter(e => e.id !== id));
  };


  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-2 flex items-center justify-between border-b border-border shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/profile" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-bold leading-tight">Edit Profile</h2>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-1.5 bg-foreground text-background rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-48 shrink-0 border-r border-border overflow-y-auto py-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 text-[14px] transition-colors ${
                  activeTab === tab 
                    ? "font-bold border-r-2 border-indigo-500 bg-slate-100 dark:bg-slate-800/50 text-indigo-500" 
                    : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
            
            {activeTab === "Basic Information" && (
              <div className="space-y-5 max-w-md">
                
                {/* Banner Photo Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-3">Profile Banner</label>
                  <label className="relative block group cursor-pointer w-full aspect-[3/1] bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-border overflow-hidden transition-transform group-hover:scale-[1.02]">
                    <div className="w-full h-full flex items-center justify-center">
                      {uploadingBanner ? (
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      ) : formData.banner_url ? (
                        <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <Plus className="w-8 h-8 mb-2" />
                          <span className="text-sm font-medium">Add Banner Image</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-full">Change Banner</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleBannerUpload} 
                      disabled={uploadingBanner}
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Profile Photo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-3">Profile Photo</label>
                  <label className="relative inline-block group cursor-pointer">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-border flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                      {uploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      ) : formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Plus className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload} 
                      disabled={uploadingAvatar}
                      className="hidden" 
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">Full Name</label>
                  <input type="text" value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Username</label>
                  <input type="text" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500" placeholder="johndoe123" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Professional Headline</label>
                  <input type="text" value={formData.headline || ''} onChange={e => setFormData({...formData, headline: e.target.value})} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500" placeholder="Senior Frontend Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Bio</label>
                  <textarea value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} rows={4} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500" placeholder="Tell the world about yourself..." />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Location</label>
                  <input type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500" placeholder="San Francisco, CA" />
                </div>
              </div>
            )}

            {activeTab === "Professional" && (
              <div className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-bold mb-1">Primary Category</label>
                  <select value={formData.primary_category || ''} onChange={e => setFormData({...formData, primary_category: e.target.value})} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500">
                    <option value="">Select category</option>
                    <option value="Design">Design</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "Portfolio" && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Portfolio Projects</h3>
                    <p className="text-sm text-muted-foreground">{portfolios.length} of 3 projects used</p>
                  </div>
                  <button onClick={handleAddProjectClick} className="flex items-center gap-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold transition-colors">
                    <Plus className="w-4 h-4" /> Add Project
                  </button>
                </div>

                {/* Project List */}
                <div className="space-y-3">
                  {portfolios.map(p => (
                    <div key={p.id} className="p-4 border border-border rounded-xl flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
                      <div>
                        <h4 className="font-bold">{p.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                      </div>
                      <button onClick={() => deletePortfolio(p.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* New Project Form Inline */}
                {showPortForm && (
                  <div className="p-5 border border-indigo-500/30 bg-indigo-500/5 rounded-xl space-y-4">
                    <h4 className="font-bold text-indigo-500 mb-2 flex items-center gap-2"><Plus className="w-4 h-4"/> New Project</h4>
                    <div><label className="text-sm font-bold">Title</label><input type="text" value={portForm.title} onChange={e => setPortForm({...portForm, title: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                    <div><label className="text-sm font-bold">Description</label><textarea value={portForm.description} onChange={e => setPortForm({...portForm, description: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-bold">Live Demo URL</label><input type="text" value={portForm.live_demo_url} onChange={e => setPortForm({...portForm, live_demo_url: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                      <div><label className="text-sm font-bold">GitHub URL</label><input type="text" value={portForm.github_url} onChange={e => setPortForm({...portForm, github_url: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setShowPortForm(false)} className="px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-800">Cancel</button>
                      <button onClick={savePortfolio} className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-bold">Save Project</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Experience" && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Work Experience</h3>
                  <button onClick={() => setShowExpForm(true)} className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors">
                    <Plus className="w-4 h-4" /> Add Experience
                  </button>
                </div>

                <div className="space-y-3">
                  {experiences.map(e => (
                    <div key={e.id} className="p-4 border border-border rounded-xl flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
                      <div>
                        <h4 className="font-bold">{e.position} <span className="font-normal text-muted-foreground">at</span> {e.company}</h4>
                        <p className="text-sm text-indigo-500 font-medium">{e.duration}</p>
                        <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
                      </div>
                      <button onClick={() => deleteExperience(e.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>

                {showExpForm && (
                  <div className="p-5 border border-border bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-bold">Company</label><input type="text" value={expForm.company} onChange={e => setExpForm({...expForm, company: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                      <div><label className="text-sm font-bold">Position</label><input type="text" value={expForm.position} onChange={e => setExpForm({...expForm, position: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                    </div>
                    <div><label className="text-sm font-bold">Duration (e.g. 2020 - Present)</label><input type="text" value={expForm.duration} onChange={e => setExpForm({...expForm, duration: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                    <div><label className="text-sm font-bold">Description</label><textarea value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setShowExpForm(false)} className="px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-800">Cancel</button>
                      <button onClick={saveExperience} className="px-4 py-1.5 bg-foreground text-background rounded-lg text-sm font-bold">Save Experience</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Education" && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Education</h3>
                  <button onClick={() => setShowEduForm(true)} className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors">
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>

                <div className="space-y-3">
                  {educations.map(e => (
                    <div key={e.id} className="p-4 border border-border rounded-xl flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
                      <div>
                        <h4 className="font-bold">{e.school}</h4>
                        <p className="text-sm font-medium">{e.degree}</p>
                        <p className="text-sm text-indigo-500 font-medium">{e.duration}</p>
                        <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
                      </div>
                      <button onClick={() => deleteEducation(e.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>

                {showEduForm && (
                  <div className="p-5 border border-border bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-bold">School / University</label><input type="text" value={eduForm.school} onChange={e => setEduForm({...eduForm, school: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                      <div><label className="text-sm font-bold">Degree</label><input type="text" value={eduForm.degree} onChange={e => setEduForm({...eduForm, degree: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                    </div>
                    <div><label className="text-sm font-bold">Duration (e.g. 2016 - 2020)</label><input type="text" value={eduForm.duration} onChange={e => setEduForm({...eduForm, duration: e.target.value})} className="w-full p-2 rounded-md border border-border bg-background mt-1" /></div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setShowEduForm(false)} className="px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-800">Cancel</button>
                      <button onClick={saveEducation} className="px-4 py-1.5 bg-foreground text-background rounded-lg text-sm font-bold">Save Education</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Social Links" && (
              <div className="space-y-5 max-w-md">
                <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">Connect your external profiles so clients and recruiters can verify your work. Make sure to hit the main Save button in the header!</p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">LinkedIn Profile</label>
                  <input type="text" value={socialLinks.linkedin || ''} onChange={e => setSocialLinks({...socialLinks, linkedin: e.target.value})} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500" placeholder="https://linkedin.com/in/username" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">X (Twitter)</label>
                  <input type="text" value={socialLinks.x_twitter || ''} onChange={e => setSocialLinks({...socialLinks, x_twitter: e.target.value})} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500" placeholder="https://x.com/username" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Instagram</label>
                  <input type="text" value={socialLinks.instagram || ''} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500" placeholder="https://instagram.com/username" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Personal Website</label>
                  <input type="text" value={socialLinks.website || ''} onChange={e => setSocialLinks({...socialLinks, website: e.target.value})} className="w-full p-2.5 rounded-lg border border-border bg-transparent focus:outline-none focus:border-indigo-500" placeholder="https://yourdomain.com" />
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
