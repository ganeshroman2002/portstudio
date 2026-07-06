"use client";
import React from "react";
import { Briefcase, Building2 } from "lucide-react";

export default function CompanySetupPage() {
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
        
        <form className="space-y-4 text-left mb-8">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Company Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Acme Inc."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
        </form>
        
        <button 
          onClick={() => window.location.replace("/checkout")}
          type="button"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors w-full"
        >
          Save and Continue
        </button>
      </div>
    </div>
  );
}
