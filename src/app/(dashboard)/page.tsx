"use client";
import React from "react";
import { CheckCircle } from "lucide-react";

export default function HomeFeedPage() {
  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-6 cursor-pointer border-b border-border">
        <h2 className="text-xl font-bold leading-tight">Home</h2>
      </div>

      {/* Post Composer Placeholder */}
      <div className="p-4 border-b border-border flex gap-3">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80" alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
        <div className="flex flex-col w-full pt-1">
          <input 
            type="text" 
            placeholder="What is happening?!" 
            className="w-full bg-transparent border-none focus:outline-none text-xl placeholder-muted-foreground"
          />
          <div className="flex justify-end mt-4">
             <button className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold transition-colors">
               Post
             </button>
          </div>
        </div>
      </div>

      {/* Feed Content Placeholder */}
      <div className="w-full">
        {[1, 2, 3, 4, 5].map((post) => (
          <div key={post} className="p-4 border-b border-border hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer flex gap-3">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80" alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-1 text-[15px]">
                <span className="font-bold hover:underline">Marcus Chen</span>
                <CheckCircle className="w-4 h-4 text-indigo-500 fill-indigo-500/20" />
                <span className="text-muted-foreground">@marcusc · 2h</span>
              </div>
              <p className="text-[15px] mt-1">
                Just pushed the new navigation structure. Using Next.js Route Groups makes organizing these layouts so much cleaner! 🚀
              </p>
              <div className="flex gap-6 mt-3 text-muted-foreground">
                <span className="text-[13px] hover:text-indigo-500 transition-colors">💬 12</span>
                <span className="text-[13px] hover:text-green-500 transition-colors">🔁 4</span>
                <span className="text-[13px] hover:text-rose-500 transition-colors">❤️ 82</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
