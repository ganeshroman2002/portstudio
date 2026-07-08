"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Calendar as CalendarIcon, Loader2, Video, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function SchedulePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const { data: rawInterviews, error } = await supabase
        .from('interviews')
        .select(`
          *,
          company:profiles!company_id(id, full_name, avatar_url),
          talent:profiles!talent_id(id, full_name, avatar_url)
        `)
        .or(`company_id.eq.${user.id},talent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching interviews:", error.message || error);
      }

      if (rawInterviews) setInterviews(rawInterviews);
      setLoading(false);
    };
    fetchSchedule();
  }, [supabase]);

  const handleUpdateStatus = async (id: string, status: string) => {
    setInterviews(interviews.map(i => i.id === id ? { ...i, status } : i));
    await supabase.from('interviews').update({ status }).eq('id', id);
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">Your Schedule</h1>
          <p className="text-muted-foreground text-sm">Upcoming interviews and meetings.</p>
        </div>
      </div>

      <div className="space-y-4">
        {interviews.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 dark:bg-[#16181c] rounded-3xl border border-border">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg">No upcoming interviews</h3>
            <p className="text-muted-foreground text-sm">When you schedule an interview, it will appear here.</p>
          </div>
        ) : (
          interviews.map((interview) => {
            const isCompany = currentUser.id === interview.company_id;
            const otherPerson = isCompany ? interview.talent : interview.company;
            const date = new Date(interview.interview_date);
            const isPast = date < new Date() && interview.status === 'scheduled';

            return (
              <div key={interview.id} className="bg-background border border-border rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6 relative overflow-hidden">
                {/* Status bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  interview.status === 'completed' ? 'bg-green-500' :
                  interview.status === 'cancelled' ? 'bg-red-500' :
                  isPast ? 'bg-amber-500' : 'bg-indigo-500'
                }`} />

                <div className="flex items-center gap-6 flex-1 pl-2">
                  <div className="flex flex-col items-center justify-center w-20 h-20 bg-slate-50 dark:bg-[#1e2128] rounded-2xl shrink-0 border border-border">
                    <span className="text-sm font-bold text-indigo-500 uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-2xl font-extrabold">{date.getDate()}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-bold text-muted-foreground">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {interview.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">
                      Interview with{' '}
                      {otherPerson?.id ? (
                        <Link href={`/profile?id=${otherPerson.id}`} className="hover:underline hover:text-indigo-500 transition-colors">
                          {otherPerson.full_name || 'User'}
                        </Link>
                      ) : (
                        <span>{otherPerson?.full_name || 'User'}</span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">{isCompany ? 'Talent' : 'Company'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                  {interview.status === 'scheduled' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(interview.id, 'completed')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(interview.id, 'cancelled')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
