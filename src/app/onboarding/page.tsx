"use client";
import React, { useState } from "react";
import { Camera, User, AtSign, Briefcase, MapPin, Globe, Link as LinkIcon, CalendarClock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";

export default function TalentOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    headline: "",
    bio: "",
    location: "",
    languages: "",
    availability: "",
    portfolio_link: ""
  });
  const supabase = createClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upsert basic profile info so it creates the row if it's missing
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: formData.full_name,
        username: formData.username,
        headline: formData.headline,
        bio: formData.bio,
        location: formData.location,
        languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
        availability: formData.availability
      });
      if (profileError) throw profileError;

      // Upsert social links (portfolio link)
      if (formData.portfolio_link) {
        const { error: socialError } = await supabase.from('social_links').upsert({
          profile_id: user.id,
          portfolio: formData.portfolio_link
        });
        if (socialError) throw socialError;
      }

      // Proceed to highly secure checkout
      window.location.replace("/checkout");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      if (error.message?.includes('profiles_username_key')) {
        alert("That username is already taken by someone else. Please choose a different username!");
      } else {
        alert("Database Error: " + (error.message || JSON.stringify(error)));
      }
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl bg-card rounded-[2rem] p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border my-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">Set Up Your Profile</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Welcome to PortStudio! Let's get your talent profile set up so you can start showcasing your work to the world.
          </p>
        </div>
        
        <form className="space-y-8" onSubmit={handleSubmit}>
          
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group cursor-pointer">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-indigo-50 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                <User className="w-12 h-12 text-indigo-200" />
              </div>
              <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 bg-indigo-600 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-medium">Upload Profile Photo</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input 
                  type="text" 
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Jane Doe"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="janedoe"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Professional Headline */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Professional Headline</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </div>
              <input 
                type="text" 
                name="headline"
                value={formData.headline}
                onChange={handleInputChange}
                placeholder="Senior Product Designer & UX Researcher"
                className="w-full pl-10 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex justify-between">
              <span>Bio</span>
              <span className="text-muted-foreground font-normal text-xs">Max 500 characters</span>
            </label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell us about your professional background, what you excel at, and what you're passionate about..."
              className="w-full p-4 bg-transparent border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="San Francisco, CA"
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Languages</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <input 
                  type="text" 
                  name="languages"
                  value={formData.languages}
                  onChange={handleInputChange}
                  placeholder="English, Spanish (Comma separated)"
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Availability */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Availability</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </div>
                <select 
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Select availability</option>
                  <option value="full-time">Available for Full-time</option>
                  <option value="freelance">Available for Freelance/Contract</option>
                  <option value="part-time">Available for Part-time</option>
                  <option value="not-looking">Not looking right now</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Social/Portfolio Link */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Portfolio / Social Link</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <input 
                  type="url" 
                  name="portfolio_link"
                  value={formData.portfolio_link}
                  onChange={handleInputChange}
                  placeholder="https://yourportfolio.com"
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center justify-center w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile Setup"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
