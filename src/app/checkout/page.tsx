"use client";
import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";

export default function SecureCheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anti-Inspect & Navigation Prevention Hooks
  useEffect(() => {
    // 1. Prevent Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Prevent F12 and specific key combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.key === "J") || // Ctrl+Shift+J
        (e.ctrlKey && e.key === "U") // Ctrl+U
      ) {
        e.preventDefault();
      }
    };

    // 3. Push a new state to history immediately to trap the back button
    window.history.pushState(null, "", window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      // Force them back forward if they press Back
      window.history.pushState(null, "", window.location.href);
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    // Dynamically load Razorpay script
    const loadScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    loadScript().then((success) => {
      if (success) {
        setLoading(false);
      } else {
        setError("Failed to load secure payment gateway. Please check your connection.");
        setLoading(false);
      }
    });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);
    try {
      // 1. Get Supabase Session
      const { createClient } = await import("@/lib/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // 2. Create Order on Server
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
      });
      
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || "Failed to create order");

      // 3. Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "dummy_key", 
        amount: orderData.amount, 
        currency: orderData.currency,
        name: "PortStudio",
        description: "Premium Platform Access",
        order_id: orderData.id, 
        handler: async function (response: any) {
          try {
             // 4. Verify Payment
             const verifyRes = await fetch("/api/payment/verify", {
               method: "POST",
               headers: { 
                 "Content-Type": "application/json",
                 "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
               },
               credentials: "include",
               body: JSON.stringify({
                 razorpay_order_id: response.razorpay_order_id,
                 razorpay_payment_id: response.razorpay_payment_id,
                 razorpay_signature: response.razorpay_signature,
               })
             });
             const verifyData = await verifyRes.json();
             
             if (verifyData.status === "success") {
               window.location.replace("/checkout/success");
             } else {
               setError("Payment verification failed. Please contact support.");
               setProcessing(false);
             }
          } catch(err) {
             setError("Error verifying payment.");
             setProcessing(false);
          }
        },
        prefill: {
          name: "PortStudio Member",
          email: "user@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#4f46e5" // indigo-600
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
         setError(`Payment Failed: ${response.error.description}`);
         setProcessing(false);
      });
      rzp.open();

    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 select-none">
      
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Secure Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Secure Payment Wall</h1>
          <p className="text-sm text-slate-500 mt-2 text-center">
            To continue accessing PortStudio, please complete your one-time payment.
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-8">
           <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-500">Access Fee</span>
              <span className="text-lg font-bold text-slate-900">₹49.00</span>
           </div>
           <div className="h-px w-full bg-slate-200 mb-4"></div>
           <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 p-3 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
              <span>256-bit Encrypted Secure Transaction</span>
           </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center font-medium">
            {error}
          </div>
        )}

        <button 
          onClick={handlePayment}
          disabled={loading || processing}
          className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading || processing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pay ₹49 Securely
            </>
          )}
        </button>

      </div>
      
      <p className="mt-8 text-xs text-slate-500 opacity-60">
        You cannot navigate backward from this page.
      </p>

    </div>
  );
}
