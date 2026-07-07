"use client";
import React, { useState } from "react";
import { Briefcase, Building2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/client";

export default function CompanySetupPage() {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const supabase = createClient();

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ 
        account_type: 'company',
        full_name: companyName || 'Company'
      }).eq('id', user.id);
    }
    setLoading(false);
    window.location.replace("/company");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center">
        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Set Up Your Company</h1>
        <p className="text-slate-500 mb-8">
          Welcome to PortStudio! Tell us a little bit about your company so you can start discovering and hiring top talent.
        </p>
        
        <form className="space-y-4 text-left mb-8" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Company Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
        </form>
        
        <button 
          onClick={handleSave}
          disabled={loading || !companyName}
          type="button"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors w-full flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save and Continue
        </button>
      </div>
    </div>
  );
}
