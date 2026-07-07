"use client";
import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, Briefcase, User, Sparkles, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // Check if user is a company
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', data.user.id)
        .single();
        
      const isCompany = data.user.user_metadata?.role === 'company' || profile?.account_type === 'company';
        
      if (isCompany) {
        window.location.href = "/company";
      } else {
        window.location.href = "/";
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden w-full flex bg-background">
      {/* Left Column - Hero/Marketing */}
      <div className="hidden lg:flex w-1/2 flex-col relative overflow-hidden bg-card">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-20%] w-[700px] h-[700px] bg-[#f3edff] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col p-8 xl:p-16 h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 xl:mb-12 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl rounded-tl-none">
              P
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">PortStudio</span>
          </div>

          {/* Typography */}
          <div className="max-w-md shrink-0">
            <h1 className="text-4xl xl:text-5xl font-extrabold text-foreground leading-tight tracking-tight mb-1">
              Show Your Talent.
            </h1>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-indigo-600 leading-tight tracking-tight mb-4">
              Get Discovered.
            </h1>
            <p className="text-base xl:text-lg text-muted-foreground leading-relaxed max-w-sm">
              Companies and brands discover talented creatives, developers, and professionals directly on PortStudio.
            </p>
          </div>

          {/* Abstract Illustration Elements */}
          <div className="flex-1 relative mt-8 transform scale-[0.85] xl:scale-100 origin-top-left">
            {/* Connection Line */}
            <svg className="absolute top-1/2 left-1/4 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 400 400">
              <path d="M 0 50 Q 150 50 150 150 T 300 250" fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="6 6" />
            </svg>

            {/* Main Portfolio Card Mockup */}
            <div className="absolute top-4 left-0 bg-card/80 backdrop-blur-xl p-5 xl:p-6 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/50 w-[380px] xl:w-[420px] transform hover:-translate-y-1 transition-transform duration-500">
              <div className="flex justify-between items-start mb-5">
                <div className="flex gap-4">
                  <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-full bg-slate-200 overflow-hidden relative border-2 border-white shadow-sm">
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                       <User className="text-indigo-300 w-5 h-5 xl:w-6 xl:h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base xl:text-lg">Sophia Lee</h3>
                    <p className="text-xs xl:text-sm text-muted-foreground">Product Designer</p>
                    <p className="text-[10px] xl:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      San Francisco, CA
                    </p>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-muted-foreground">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>
              </div>

              <div className="flex gap-2 mb-5">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] xl:text-xs font-medium">UI/UX</span>
                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] xl:text-xs font-medium">Figma</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] xl:text-xs font-medium">Web Design</span>
              </div>

              <div className="grid grid-cols-3 gap-2 xl:gap-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="aspect-[4/5] rounded-xl bg-slate-100 overflow-hidden relative group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Notification - New Match */}
            <div className="absolute top-24 right-4 bg-card/90 backdrop-blur p-3 xl:p-4 rounded-xl shadow-xl border border-border flex items-center gap-3 transform hover:scale-105 transition-transform animate-[bounce_4s_infinite]">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <div className="w-3 h-3 bg-indigo-600 rounded-full" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">New Match</p>
                <p className="text-[10px] text-muted-foreground">Design Lead<br/>Acme Inc.</p>
              </div>
            </div>

            {/* Talent Shortlist */}
            <div className="absolute bottom-16 left-12 bg-card/90 backdrop-blur p-3 xl:p-4 rounded-xl shadow-xl border border-border">
               <p className="text-xs font-bold text-foreground mb-2">Talent Shortlist</p>
               <div className="flex -space-x-2">
                 {[1,2,3,4].map((i) => (
                   <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden">
                      <User className="text-muted-foreground w-4 h-4" />
                   </div>
                 ))}
                 <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                   +12
                 </div>
               </div>
            </div>
            
            {/* Sparkle Decorative elements */}
            <div className="absolute top-0 right-16 w-12 h-12 xl:w-16 xl:h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
               <User className="text-white w-6 h-6 xl:w-8 xl:h-8" />
            </div>
            
            <div className="absolute bottom-8 left-0 w-10 h-10 xl:w-14 xl:h-14 bg-card rounded-2xl flex items-center justify-center shadow-lg border border-border transform -rotate-6">
               <Sparkles className="text-indigo-500 w-5 h-5 xl:w-6 xl:h-6" />
            </div>

          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto flex flex-col p-4 sm:p-8">
        <div className="w-full max-w-[420px] m-auto bg-card rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border shrink-0">
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">Welcome Back</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Sign in to continue to PortStudio</p>
          </div>

          <form className="space-y-4" onSubmit={handleEmailLogin}>
            {error && (
              <div className="p-3 text-xs sm:text-sm bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-card border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••••••"
                  className="w-full pl-9 pr-10 py-2 sm:py-2.5 bg-card border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors tracking-widest placeholder:tracking-widest font-mono"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground hover:text-muted-foreground transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground hover:text-muted-foreground transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-indigo-500 rounded flex items-center justify-center peer-checked:bg-indigo-600 transition-colors">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
              </label>
              <Link href="#" className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-medium shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] sm:text-xs">
                <span className="bg-card px-3 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <div className="mt-4 flex">
              <button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 sm:px-4 bg-card border border-border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-xs sm:text-sm font-medium text-foreground">Continue with Google</span>
              </button>
            </div>

            <p className="mt-4 sm:mt-5 text-center text-xs sm:text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
                Create Account
              </Link>
            </p>
          </div>

          <div className="mt-6">
             <div className="relative mb-4 sm:mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] sm:text-xs">
                <span className="bg-card px-3 text-muted-foreground">Join as</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
              <Link href="/auth/signup?role=talent" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border border-transparent bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 transition-all text-left group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight mb-0.5">Join as Talent</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">Showcase your work</p>
                </div>
              </Link>

              <Link href="/auth/signup?role=company" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border border-transparent bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 transition-all text-left group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 text-purple-600 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight mb-0.5">Join as Company</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">Find and hire talent</p>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
