"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Building2, MapPin, Loader2, ArrowLeft, Link as LinkIcon, Calendar } from "lucide-react";
import Link from "next/link";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_type', 'company');
      
      if (data) {
        setCompanies(data);
      }
      setLoading(false);
    };
    fetchCompanies();
  }, [supabase]);

  return (
    <div className="flex w-full h-full relative">
      <div className="flex-1 max-w-[800px] border-r border-border h-full overflow-y-auto hide-scrollbar flex flex-col relative bg-background mx-auto">
        
        {!selectedCompany ? (
          <>
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border flex flex-col">
              <h2 className="text-xl font-bold leading-tight">Companies</h2>
              <p className="text-[13px] text-muted-foreground">Discover and connect with top organizations</p>
            </div>

            <div className="w-full bg-slate-50/50 dark:bg-[#16181c] min-h-screen">
              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center p-12 m-4 bg-card border border-border rounded-2xl shadow-sm">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No companies found</h3>
                  <p className="text-muted-foreground">Check back later as new organizations join PortStudio.</p>
                </div>
              ) : (
                <div className="flex flex-col p-4 gap-6 pb-24">
                  {companies.map(company => (
                    <div key={company.id} className="w-full border border-border rounded-3xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      {/* Card Banner */}
                      <div className="w-full h-[140px] sm:h-[180px] bg-slate-200 dark:bg-slate-800 relative shrink-0">
                        {company.banner_url && <img src={company.banner_url} className="w-full h-full object-cover" />}
                        
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-[12px] font-bold uppercase tracking-wider z-10 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Company
                        </div>
                      </div>

                      {/* Overlapping Content Block */}
                      <div className="relative -mt-12 bg-card rounded-t-[32px] pt-4 px-4 pb-5 sm:pt-6 sm:px-6 sm:pb-6 flex flex-col gap-4 sm:gap-5 z-10 flex-1">
                        <div className="flex gap-4 sm:gap-6">
                          {/* Profile Picture */}
                          <div className="relative -mt-10 sm:-mt-14 shrink-0">
                            <div className="w-[84px] h-[84px] sm:w-[104px] sm:h-[104px] bg-slate-300 dark:bg-slate-700 rounded-full border-[6px] border-card flex items-center justify-center overflow-hidden shadow-sm">
                              {company.avatar_url ? (
                                <img src={company.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                <Building2 className="w-10 h-10 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex flex-col flex-1 pt-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-[18px] sm:text-[20px] leading-tight hover:underline cursor-pointer">{company.full_name || 'Company Name'}</h4>
                              <span className="text-muted-foreground text-[14px] sm:text-[15px]">@{company.username || 'company'}</span>
                            </div>
                            <p className="text-[14px] sm:text-[15px] leading-snug text-muted-foreground mt-1 line-clamp-2">{company.bio || "No description provided yet."}</p>
                            
                            {company.location && (
                              <div className="flex items-center gap-2 mt-2.5 text-[13px] sm:text-[14px] font-medium text-muted-foreground">
                                <MapPin className="w-4 h-4" /> {company.location}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 sm:gap-4 mt-2">
                          <button
                            onClick={() => setSelectedCompany(company)}
                            className="flex-1 py-2 sm:py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white transition-colors rounded-xl sm:rounded-2xl font-bold text-[14px] sm:text-[15px]"
                          >
                            View Company Details
                          </button>
                          <button className="px-5 sm:px-6 py-2 sm:py-2.5 bg-transparent border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-xl sm:rounded-2xl font-bold text-[14px] sm:text-[15px]">
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Detailed Company View */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-6 cursor-pointer border-b border-border hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors" onClick={() => setSelectedCompany(null)}>
              <ArrowLeft className="w-5 h-5" />
              <div className="flex flex-col">
                <h2 className="text-xl font-bold leading-tight">{selectedCompany.full_name || 'Company'}</h2>
                <span className="text-[13px] text-muted-foreground">Company Profile</span>
              </div>
            </div>

            <div className="pb-24">
              <div className="w-full aspect-[3/1] bg-slate-200 dark:bg-slate-800 relative">
                {selectedCompany.banner_url && <img src={selectedCompany.banner_url} className="w-full h-full object-cover" />}
                <div className="absolute -bottom-16 left-6 rounded-full border-4 border-card bg-slate-200">
                  <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-slate-900">
                    {selectedCompany.avatar_url ? (
                      <img src={selectedCompany.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 pt-20 flex flex-col gap-4">
                <div className="flex flex-col">
                  <h1 className="text-3xl font-extrabold leading-tight">{selectedCompany.full_name || "Company Name"}</h1>
                  <span className="text-lg text-muted-foreground mt-0.5">@{selectedCompany.username || "company"}</span>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-muted-foreground font-medium">
                  {selectedCompany.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {selectedCompany.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Joined Recently
                  </div>
                </div>

                {selectedCompany.bio && (
                  <div className="mt-4">
                    <h3 className="font-bold text-lg mb-2">About</h3>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90 bg-slate-50 dark:bg-[#16181c] p-4 rounded-xl border border-border">
                      {selectedCompany.bio}
                    </p>
                  </div>
                )}
                
                {/* We can add open roles or recent activity here in the future */}
                <div className="mt-6 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#16181c] rounded-2xl border border-border border-dashed">
                  <Building2 className="w-10 h-10 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium text-center">No open positions posted yet.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
