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
      <div className="p-4 flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded h-52 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" fill="#FC5200" />
            <path d="M18 8l-4 8h3l-5 10 10-12h-4z" fill="white" />
          </svg>
          <span className="font-bold text-lg text-[#353633]">ReadStrava</span>
        </div>
        <Link href="/explore" className="p-2 hover:bg-gray-100 rounded transition-colors">
          <Users size={20} className="text-gray-500" />
        </Link>
      </header>

      <div className="p-4 flex flex-col gap-3">
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
            <h2 className="font-bold text-[#353633] mb-2">Seu feed está vazio</h2>
            <p className="text-sm text-gray-500 mb-6">Siga outros leitores ou registre sua primeira sessão</p>
            <Link
              href="/record"
              className="inline-block bg-[#FC5200] hover:bg-[#e04900] text-white font-bold rounded px-6 py-3 transition-colors uppercase tracking-wide text-sm"
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
              {hasMore && <div className="w-5 h-5 border-2 border-gray-300 border-t-[#FC5200] rounded-full animate-spin" />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
