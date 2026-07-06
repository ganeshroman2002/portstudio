"use client";
import React, { useEffect } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {

  useEffect(() => {
    // Trap the back button here too, so they can't go back to the payment page.
    window.history.pushState(null, "", window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center relative overflow-hidden">
        
        {/* Confetti Background elements */}
        <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-teal-200/40 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Payment Successful!</h1>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Your transaction has been securely verified. Welcome to the PortStudio community!
          </p>

          <Link href="/" className="inline-flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
