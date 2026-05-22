"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { ArrowLeft, Send, BookOpen, Pencil, Trash2, X } from "lucide-react";
import { formatDuration, formatPace, timeAgo } from "@/lib/utils";

const MOOD_ICONS = ["", "😴", "😐", "🙂", "😊", "🔥"];
const LOCATIONS = [
  { value: "home", label: "🏠 Casa" },
  { value: "cafe", label: "☕ Café" },
  { value: "transit", label: "🚌 Transporte" },
  { value: "other", label: "📍 Outro" },
];

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { request } = useApi();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    startPage: "",
    endPage: "",
    durationHours: "",
    durationMinutes: "",
    mood: null as number | null,
    locationTag: "",
    highlight: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request(`/api/sessions/${sessionId}`).then((r) => r.json()).then((d) => {
      setData(d);
      if (d.session) {
        const s = d.session;
        const totalMin = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0;
        setEditForm({
          startPage: String(s.startPage ?? ""),
          endPage: String(s.endPage ?? ""),
          durationHours: String(Math.floor(totalMin / 60) || ""),
          durationMinutes: String(totalMin % 60 || ""),
          mood: s.mood ?? null,
          locationTag: s.locationTag ?? "",
          highlight: s.highlight ?? "",
        });
      }
      setLoading(false);
    });
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

  const saveEdit = async () => {
    setSaving(true);
    const totalSeconds = (parseInt(editForm.durationHours || "0") * 3600) + (parseInt(editForm.durationMinutes || "0") * 60);
    const res = await request(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "edit",
        startPage: parseInt(editForm.startPage),
        endPage: parseInt(editForm.endPage),
        durationSeconds: totalSeconds > 0 ? totalSeconds : null,
        mood: editForm.mood,
        locationTag: editForm.locationTag || null,
        highlight: editForm.highlight || null,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setData((prev: any) => ({ ...prev, session: { ...prev.session, ...d.session } }));
      setShowEdit(false);
    }
    setSaving(false);
  };

  const deleteSession = async () => {
    if (!confirm("Deletar esta sessão? Esta ação não pode ser desfeita.")) return;
    const res = await request(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (res.ok) router.replace("/feed");
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
        <h1 className="font-bold text-lg flex-1">Sessão de leitura</h1>
        <button onClick={() => setShowEdit(true)} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400">
          <Pencil size={18} />
        </button>
        <button onClick={deleteSession} className="p-2 rounded-xl hover:bg-neutral-800 text-red-500">
          <Trash2 size={18} />
        </button>
      </header>

      <div className="p-4 flex flex-col gap-5">
        {/* Card estilo Strava */}
        <div className="relative aspect-[9/16] w-full max-w-xs mx-auto overflow-hidden rounded-2xl shadow-2xl">
          {s.book?.coverUrl ? (
            <Image src={s.book.coverUrl} alt="" fill className="object-cover scale-125 blur-lg" priority />
          ) : (
            <div className="absolute inset-0 bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 h-full flex flex-col p-8">
            <div className="mt-2">
              <p className="text-white font-bold text-2xl leading-tight">{s.book?.title}</p>
              <p className="text-white/60 text-sm mt-1">{s.book?.author}</p>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-7">
              {stats.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-white font-bold text-5xl leading-none">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2">
              <BookOpen size={22} className="text-[#FC5200]" strokeWidth={2.5} />
              <span className="text-white font-bold tracking-[0.15em] text-sm">READSTRAVA</span>
              {user?.username && <span className="text-white/40 text-xs ml-1">• @{user.username}</span>}
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-600 text-center">Tire um screenshot para compartilhar ✨</p>

        <div className="flex gap-4 text-sm text-neutral-400">
          {s.mood && <span>Humor: {MOOD_ICONS[s.mood]}</span>}
          {s.locationTag && <span>📍 {LOCATIONS.find((l) => l.value === s.locationTag)?.label ?? s.locationTag}</span>}
          {s.startPage != null && <span>Págs {s.startPage}–{s.endPage}</span>}
          {s.endedAt && <span className="ml-auto text-neutral-600">{timeAgo(s.endedAt)}</span>}
        </div>

        {s.highlight && (
          <blockquote className="border-l-2 border-[#FC5200] pl-4">
            <p className="text-sm text-neutral-300 italic">"{s.highlight}"</p>
          </blockquote>
        )}

        {/* Comentários */}
        <div>
          <h2 className="font-semibold mb-3">Comentários ({s.comments?.length ?? 0})</h2>
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

      {/* Modal de edição */}
      {showEdit && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end" onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="bg-neutral-900 w-full max-w-lg mx-auto rounded-t-2xl p-5 flex flex-col gap-4" style={{ maxHeight: "85vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Editar sessão</h2>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-neutral-800 rounded-xl">
                <X size={18} />
              </button>
            </div>

            {/* Páginas */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Pág. inicial</label>
                <input
                  type="number"
                  value={editForm.startPage}
                  onChange={(e) => setEditForm((p) => ({ ...p, startPage: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Pág. final</label>
                <input
                  type="number"
                  value={editForm.endPage}
                  onChange={(e) => setEditForm((p) => ({ ...p, endPage: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none"
                />
              </div>
            </div>

            {/* Tempo */}
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Tempo de leitura</label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={editForm.durationHours}
                    onChange={(e) => setEditForm((p) => ({ ...p, durationHours: e.target.value }))}
                    min={0}
                    placeholder="0"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none pr-14"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500">horas</span>
                </div>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={editForm.durationMinutes}
                    onChange={(e) => setEditForm((p) => ({ ...p, durationMinutes: e.target.value }))}
                    min={0}
                    max={59}
                    placeholder="0"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500">min</span>
                </div>
              </div>
            </div>

            {/* Humor */}
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-2">Humor</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setEditForm((p) => ({ ...p, mood: p.mood === n ? null : n }))}
                    className={`flex-1 py-2 rounded-xl text-xl transition-colors ${editForm.mood === n ? "bg-[#FC5200]/20 ring-1 ring-[#FC5200]" : "bg-neutral-800 hover:bg-neutral-700"}`}
                  >
                    {MOOD_ICONS[n]}
                  </button>
                ))}
              </div>
            </div>

            {/* Local */}
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-2">Local</label>
              <div className="grid grid-cols-2 gap-2">
                {LOCATIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setEditForm((p) => ({ ...p, locationTag: p.locationTag === value ? "" : value }))}
                    className={`py-2 px-3 rounded-xl text-sm transition-colors ${editForm.locationTag === value ? "bg-[#FC5200]/20 text-[#FC5200] ring-1 ring-[#FC5200]" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Destaque */}
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Destaque / citação</label>
              <textarea
                value={editForm.highlight}
                onChange={(e) => setEditForm((p) => ({ ...p, highlight: e.target.value }))}
                rows={2}
                maxLength={1000}
                placeholder="Uma frase marcante..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none resize-none text-sm"
              />
            </div>

            <button
              onClick={saveEdit}
              disabled={saving || !editForm.startPage || !editForm.endPage}
              className="w-full bg-[#FC5200] hover:bg-orange-400 disabled:opacity-40 text-white font-bold rounded-xl py-3"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
