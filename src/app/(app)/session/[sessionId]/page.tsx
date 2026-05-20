"use client";

import { useEffect, useState, useRef } from "react";
import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { ArrowLeft, Download, Send, BookOpen } from "lucide-react";
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
  const [cardTheme, setCardTheme] = useState<"dark" | "light" | "emerald">("dark");
  const cardRef = useRef<HTMLDivElement>(null);

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
  const themeClasses = {
    dark: "bg-neutral-900 text-white",
    light: "bg-white text-neutral-900",
    emerald: "bg-emerald-900 text-white",
  };

  const ShareCard = ({ format }: { format: "stories" | "feed" }) => (
    <div
      ref={format === "stories" ? cardRef : undefined}
      className={`${themeClasses[cardTheme]} rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-4 p-6 ${
        format === "stories" ? "aspect-[9/16] w-full" : "aspect-square w-full"
      }`}
    >
      <div className="w-24 h-32 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 bg-neutral-800">
        {s.book?.coverUrl ? (
          <Image src={s.book.coverUrl} alt={s.book.title} width={96} height={128} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={32} className="text-neutral-600" />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="font-bold text-lg leading-tight">{s.book?.title}</p>
        <p className="text-sm opacity-60">{s.book?.author}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { label: "Páginas", value: s.pagesRead ?? 0 },
          { label: "Tempo", value: s.durationSeconds ? formatDuration(s.durationSeconds) : "—" },
          { label: "Pace", value: s.pacePerHour ? `${Math.round(s.pacePerHour)}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="text-center rounded-xl p-2 bg-black/20">
            <p className="font-bold text-xl">{value}</p>
            <p className="text-[10px] opacity-60 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {s.highlight && (
        <p className="text-sm italic opacity-80 text-center line-clamp-2">"{s.highlight}"</p>
      )}

      <div className="flex items-center gap-1.5 mt-auto">
        <div className="w-5 h-5 bg-emerald-500 rounded-md flex items-center justify-center">
          <BookOpen size={10} className="text-white" />
        </div>
        <span className="text-xs font-bold opacity-70">ReadStrava</span>
        {user?.username && <span className="text-xs opacity-50">• @{user.username}</span>}
      </div>
    </div>
  );

  return (
    <div>
      <header className="px-4 py-3 flex items-center gap-3 border-b border-neutral-800">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-neutral-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Detalhe da sessão</h1>
      </header>

      <div className="p-4 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-16 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
            {s.book?.coverUrl && <Image src={s.book.coverUrl} alt={s.book.title} width={48} height={64} className="object-cover w-full h-full" />}
          </div>
          <div>
            <p className="font-bold">{s.book?.title}</p>
            <p className="text-sm text-neutral-500">{s.book?.author}</p>
            {s.endedAt && <p className="text-xs text-neutral-600">{timeAgo(s.endedAt)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-900 rounded-xl p-3 text-center border border-neutral-800">
            <p className="text-2xl font-bold text-emerald-400">{s.pagesRead ?? 0}</p>
            <p className="text-[10px] text-neutral-500">páginas</p>
          </div>
          <div className="bg-neutral-900 rounded-xl p-3 text-center border border-neutral-800">
            <p className="text-2xl font-bold">{s.durationSeconds ? formatDuration(s.durationSeconds) : "—"}</p>
            <p className="text-[10px] text-neutral-500">tempo</p>
          </div>
          <div className="bg-neutral-900 rounded-xl p-3 text-center border border-neutral-800">
            <p className="text-2xl font-bold">{s.pacePerHour ? formatPace(s.pacePerHour) : "—"}</p>
            <p className="text-[10px] text-neutral-500">pace</p>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-neutral-400">
          {s.mood && <span>Humor: {MOOD_ICONS[s.mood]}</span>}
          {s.locationTag && <span>📍 {s.locationTag}</span>}
          {s.startPage != null && <span>Páginas {s.startPage}–{s.endPage}</span>}
        </div>

        {s.highlight && (
          <blockquote className="border-l-2 border-emerald-500 pl-4">
            <p className="text-sm text-neutral-300 italic">"{s.highlight}"</p>
          </blockquote>
        )}

        <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Download size={16} className="text-emerald-400" />
            Card para compartilhar
          </h2>

          <div className="flex gap-2 mb-4">
            {(["dark", "light", "emerald"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCardTheme(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  cardTheme === t ? "bg-emerald-500 text-white" : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {t === "dark" ? "Escuro" : t === "light" ? "Claro" : "Verde"}
              </button>
            ))}
          </div>

          <div className="w-full max-w-xs mx-auto">
            <ShareCard format="feed" />
          </div>

          <p className="text-xs text-neutral-600 text-center mt-3">
            Faça uma screenshot para compartilhar nos Stories ✨
          </p>
        </div>

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
                  <p className="text-xs font-semibold text-emerald-400 mb-1">@{c.user?.username}</p>
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
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="w-12 h-12 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
            >
              <Send size={16} className="text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
