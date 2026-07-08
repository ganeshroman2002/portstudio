"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Zap, Shield, BarChart3, Star, Loader2 } from "lucide-react";
import { createClient } from "@/lib/client";

export default function PremiumPage() {
  const [profile, setProfile] = useState<any>(null);
  const [pitchesCount, setPitchesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch user profile (to get any upgraded limits if they exist)
        const { data } = await supabase.from('profiles').select('available_pitches, subscription_tier').eq('id', user.id).single();
        if (data) setProfile(data);
        
        // Fetch how many pitches the user has actually posted
        const { count } = await supabase
          .from('talent_pitches')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', user.id);
          
        setPitchesCount(count || 0);
      }
      setLoading(false);
    };
    fetchProfileData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const totalLimit = profile?.available_pitches ?? 3;
  const pitchesLeft = Math.max(0, totalLimit - pitchesCount);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-2 flex items-center gap-6 border-b border-border">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-800/50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold leading-tight flex items-center gap-2">
          <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" />
          Premium
        </h2>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 sm:p-8 flex flex-col items-center pt-8 pb-24">
        
        {/* Current Plan Details */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-bold mb-2">Your Current Status</h3>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Pitches Remaining:</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{pitchesLeft} / {totalLimit}</span>
          </div>
          {pitchesLeft === 0 && (
            <div className="mt-3 text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg text-center">
              You are out of pitches! Buy a pack to keep posting.
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-6">
            <Zap className="w-4 h-4 fill-current" />
            Pay As You Go
          </div>
          <h1 className="text-4xl font-extrabold mb-6 tracking-tight">
            Need more visibility?
          </h1>
          <p className="text-lg text-muted-foreground">
            Get more pitches instantly to showcase your talent to top companies.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="w-full max-w-md bg-background rounded-3xl border border-border shadow-xl overflow-hidden relative">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          
          <div className="p-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-2xl font-extrabold mb-1">Pitch Booster</h3>
                <p className="text-muted-foreground text-sm">+3 Extra Pitches</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black">₹49</span>
              </div>
            </div>

            {pitchesLeft > 0 ? (
              <button 
                disabled
                className="w-full py-4 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mb-8 cursor-not-allowed"
              >
                Use all pitches to unlock
                <Zap className="w-5 h-5 opacity-50" />
              </button>
            ) : (
              <Link 
                href="/checkout" 
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 mb-8"
              >
                Buy 3 Pitches for ₹49
                <Zap className="w-5 h-5" />
              </Link>
            )}

            <div className="space-y-4">
              {[
                { icon: Zap, text: "Unlimited Pitches (No more 3-pitch limit)" },
                { icon: Shield, text: "Verified Premium Badge on your profile" },
                { icon: Star, text: "Priority Matching in 'You might like' section" },
                { icon: BarChart3, text: "Advanced Profile Analytics & Views" },
                { icon: CheckCircle2, text: "Direct messaging with top recruiters" },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <feature.icon className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  <span className="text-[15px] font-medium leading-snug">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-[#1a1c1e] p-6 text-center border-t border-border">
            <p className="text-xs text-muted-foreground font-medium">Secure payment powered by Razorpay. Cancel anytime.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
