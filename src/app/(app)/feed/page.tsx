"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { SessionCard } from "@/components/feed/SessionCard";
import { BookOpen, Users } from "lucide-react";
import Link from "next/link";

export default function FeedPage() {
  const { request } = useApi();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async (p: number) => {
    const res = await request(`/api/feed?page=${p}&limit=20`);
    if (!res.ok) return;
    const data = await res.json();
    setSessions((prev) => p === 1 ? data.sessions : [...prev, ...data.sessions]);
    setHasMore(data.sessions.length === 20);
    setLoading(false);
  }, [request]);

  useEffect(() => { loadMore(1); }, []);

  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage((p) => { loadMore(p + 1); return p + 1; });
      }
    });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, loadMore]);

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-neutral-900 rounded-2xl h-52 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-sm border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-bold text-lg">ReadStrava</span>
        </div>
        <Link href="/explore" className="p-2 rounded-xl hover:bg-neutral-800 transition-colors">
          <Users size={20} className="text-neutral-400" />
        </Link>
      </header>

      <div className="p-4 flex flex-col gap-4">
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-neutral-700 mx-auto mb-4" />
            <h2 className="font-semibold text-neutral-300 mb-2">Seu feed está vazio</h2>
            <p className="text-sm text-neutral-500 mb-6">Siga outros leitores ou registre sua primeira sessão</p>
            <Link
              href="/record"
              className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
            >
              Registrar leitura
            </Link>
          </div>
        ) : (
          <>
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
            <div ref={loaderRef} className="h-8 flex items-center justify-center">
              {hasMore && <div className="w-5 h-5 border-2 border-neutral-700 border-t-emerald-500 rounded-full animate-spin" />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
