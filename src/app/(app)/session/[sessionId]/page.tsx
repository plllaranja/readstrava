"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { ArrowLeft, Send, BookOpen } from "lucide-react";
import { formatDuration, formatPace, timeAgo } from "@/lib/utils";

const MOOD_ICONS = ["", "😴", "😐", "🙂", "😊", "🔥"];

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { request } = useApi();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    request(`/api/sessions/${sessionId}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [sessionId]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    const res = await request(`/api/sessions/${sessionId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: comment }),
    });
    if (res.ok) {
      const d = await res.json();
      setData((prev: any) => ({ ...prev, session: { ...prev.session, comments: [...(prev.session.comments ?? []), d.comment] } }));
      setComment("");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-4"><div className="bg-neutral-900 h-64 rounded-2xl animate-pulse" /></div>;
  if (!data?.session) return <div className="p-4 text-center text-neutral-500">Sessão não encontrada</div>;

  const s = data.session;

  const stats = [
    { label: "Páginas lidas", value: String(s.pagesRead ?? 0) },
    { label: "Pace", value: s.pacePerHour ? formatPace(s.pacePerHour) : "—" },
    { label: "Tempo total", value: s.durationSeconds ? formatDuration(s.durationSeconds) : "—" },
  ];

  return (
    <div>
      <header className="px-4 py-3 flex items-center gap-3 border-b border-neutral-800">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-neutral-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Sessão de leitura</h1>
      </header>

      <div className="p-4 flex flex-col gap-5">

        {/* Card estilo Strava */}
        <div className="relative aspect-[9/16] w-full max-w-xs mx-auto overflow-hidden rounded-2xl shadow-2xl">
          {/* Fundo: capa do livro com blur */}
          {s.book?.coverUrl ? (
            <Image
              src={s.book.coverUrl}
              alt=""
              fill
              className="object-cover scale-125 blur-lg"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-900" />
          )}
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Conteúdo */}
          <div className="relative z-10 h-full flex flex-col p-8">
            {/* Título do livro */}
            <div className="mt-2">
              <p className="text-white font-bold text-2xl leading-tight">{s.book?.title}</p>
              <p className="text-white/60 text-sm mt-1">{s.book?.author}</p>
            </div>

            {/* Stats centralizados */}
            <div className="flex-1 flex flex-col justify-center gap-7">
              {stats.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-white font-bold text-5xl leading-none">{value}</p>
                </div>
              ))}
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-center gap-2">
              <BookOpen size={22} className="text-[#FC5200]" strokeWidth={2.5} />
              <span className="text-white font-bold tracking-[0.15em] text-sm">READSTRAVA</span>
              {user?.username && (
                <span className="text-white/40 text-xs ml-1">• @{user.username}</span>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-600 text-center">
          Tire um screenshot para compartilhar ✨
        </p>

        {/* Detalhes extras */}
        <div className="flex gap-4 text-sm text-neutral-400">
          {s.mood && <span>Humor: {MOOD_ICONS[s.mood]}</span>}
          {s.locationTag && <span>📍 {s.locationTag}</span>}
          {s.startPage != null && <span>Páginas {s.startPage}–{s.endPage}</span>}
          {s.endedAt && <span className="ml-auto text-neutral-600">{timeAgo(s.endedAt)}</span>}
        </div>

        {s.highlight && (
          <blockquote className="border-l-2 border-[#FC5200] pl-4">
            <p className="text-sm text-neutral-300 italic">"{s.highlight}"</p>
          </blockquote>
        )}

        {/* Comentários */}
        <div>
          <h2 className="font-semibold mb-3">
            Comentários ({s.comments?.length ?? 0})
          </h2>

          <div className="flex flex-col gap-3 mb-4">
            {(s.comments ?? []).map((c: any) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-neutral-500">
                  {c.user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 bg-neutral-900 rounded-xl p-3 border border-neutral-800">
                  <p className="text-xs font-semibold text-[#FC5200] mb-1">@{c.user?.username}</p>
                  <p className="text-sm text-neutral-300">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submitComment} className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicionar comentário..."
              maxLength={500}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[#FC5200] focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="w-12 h-12 bg-[#FC5200] hover:bg-orange-400 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
            >
              <Send size={16} className="text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
