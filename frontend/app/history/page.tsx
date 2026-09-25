"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, History, ShieldCheck } from 'lucide-react';

interface CompletedScenario {
  id: string;
  title: string;
  channel: string;
  score: number | null;
  is_safe: boolean | null;
  chosen_action: string;
  completed_at: string | null;
}

const pageSize = 20;

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<CompletedScenario[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (offset: number) => {
    const token = localStorage.getItem('cyberguard_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/coach/completed-scenarios?limit=${pageSize}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok) throw new Error('Could not load completed scenarios.');
      const result = await response.json();
      if (!result.success || !Array.isArray(result.items)) throw new Error('Could not load completed scenarios.');
      setItems(previous => offset === 0 ? result.items : [...previous, ...result.items]);
      setTotal(result.total);
      setHasMore(result.has_more);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load completed scenarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPage(0); }, []);

  return (
    <main className="min-h-screen bg-background text-primary">
      <header className="border-b border-white/[0.07] bg-[#0B0F14]/90">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted">Training record</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-9">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-blue/20 bg-blue/10 text-[#A5B8FF]"><History className="w-5 h-5" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Completed Scenarios</h1>
            <p className="text-sm text-muted mt-1">Review every saved attempt, score, and decision.</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 text-xs font-mono uppercase tracking-wider text-muted">
          <span>{loading && items.length === 0 ? 'Loading…' : `${total} completed ${total === 1 ? 'scenario' : 'scenarios'}`}</span>
          <span>Newest first</span>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200 mb-4">{error} <button onClick={() => void loadPage(items.length)} className="underline ml-2">Retry</button></div>}

        {loading && items.length === 0 && <p className="py-12 text-center text-muted">Loading your history…</p>}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 text-center">
            <ShieldCheck className="w-9 h-9 mx-auto text-[#A5B8FF]/70" />
            <h2 className="mt-4 font-semibold">No completed scenarios yet</h2>
            <p className="text-sm text-muted mt-1">Your completed simulations will appear here after evaluation.</p>
            <Link href="/dashboard" className="inline-flex mt-5 rounded-lg border border-blue/30 bg-blue/10 px-4 py-2 text-sm text-[#A5B8FF]">Start a scenario</Link>
          </div>
        )}

        <div className="space-y-3">
          {items.map(item => (
            <Link key={item.id} href={`/history/${encodeURIComponent(item.id)}`}
              className="group block rounded-2xl border border-white/[0.08] bg-[#111821]/80 p-4 sm:p-5 hover:border-blue/30 hover:bg-[#151E2A] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm sm:text-base truncate">{item.title}</h2>
                  <p className="text-xs font-mono text-muted mt-1 capitalize">
                    {item.channel.replace(/_/g, ' ')}
                    {item.completed_at && ` · ${new Date(item.completed_at).toLocaleDateString()}`}
                    {' · '}{item.is_safe === null ? 'Evaluated' : item.is_safe ? 'Safe decision' : 'Needs practice'}
                  </p>
                  {item.chosen_action && <p className="text-xs text-muted mt-3 line-clamp-1">Your action: {item.chosen_action}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-lg font-semibold text-[#A5B8FF]">{item.score === null ? '—' : `${Math.round(item.score)}/100`}</span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && !error && <button type="button" disabled={loading} onClick={() => void loadPage(items.length)}
          className="mt-6 w-full rounded-xl border border-white/10 py-3 text-sm text-primary/80 hover:bg-white/[0.04] disabled:opacity-50">
          {loading ? 'Loading…' : 'Load more scenarios'}
        </button>}
      </div>
    </main>
  );
}
