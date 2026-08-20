"use client";
import Link from 'next/link';

export default function EvaluationPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F7] p-4 md:p-8 font-sans selection:bg-blue-200 flex flex-col items-center justify-center">
      
      <div className="w-full max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden text-center p-10 md:p-14">
        
        {/* Status Icon */}
        <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
          <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Safe Decision!</h1>
        <p className="text-slate-500 font-medium">You forwarded the email to IT.</p>

        <div className="my-10 text-left bg-[#F5F5F7] p-6 rounded-[2rem] border border-slate-200/60">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-indigo-600 text-xs font-semibold tracking-wide uppercase mb-4 shadow-sm">
            Evaluation Agent Analysis
          </div>
          <p className="text-slate-700 font-medium leading-relaxed mb-4 text-sm md:text-base">
            Excellent work! You successfully identified the mismatch in the sender's email address and correctly followed NovaTech's protocol by forwarding the suspicious request to IT instead of engaging with it.
          </p>
          <div className="space-y-2">
             <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
               <span className="text-sm font-medium text-slate-600">Threat Identified</span>
               <span className="text-sm font-semibold text-slate-900">Phishing Link</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
               <span className="text-sm font-medium text-slate-600">Points Earned</span>
               <span className="text-sm font-semibold text-emerald-600">+15 XP</span>
             </div>
          </div>
        </div>

        <Link href="/" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-4 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 w-full md:w-auto">
          Return to Dashboard
        </Link>
      </div>

    </main>
  );
}
