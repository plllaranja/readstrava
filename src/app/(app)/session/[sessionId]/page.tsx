"use client";

import { useEffect, useState, useRef } from "react";
import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Send, BookOpen, Pencil, Trash2, X, Download } from "lucide-react";
import { formatDuration, formatPace, timeAgo } from "@/lib/utils";

type CardLayout = "center" | "left" | "bottom" | "side";
type TextColor = "white" | "black";

const MOOD_ICONS = ["", "😴", "😐", "🙂", "😊", "🔥"];
const LOCATIONS = [
  { value: "home", label: "🏠 Casa" },
  { value: "cafe", label: "☕ Café" },
  { value: "transit", label: "🚌 Transporte" },
  { value: "other", label: "📍 Outro" },
];

const LAYOUTS: { id: CardLayout; label: string; preview: React.ReactNode }[] = [
  {
    id: "center",
    label: "Centro",
    preview: (
      <div className="w-8 h-12 rounded border border-neutral-600 overflow-hidden bg-neutral-800 flex flex-col items-center justify-center gap-1">
        <div className="w-4 h-0.5 bg-neutral-400 rounded" /><div className="w-4 h-0.5 bg-neutral-400 rounded" /><div className="w-4 h-0.5 bg-neutral-400 rounded" />
      </div>
    ),
  },
  {
    id: "left",
    label: "Esquerda",
    preview: (
      <div className="w-8 h-12 rounded border border-neutral-600 overflow-hidden bg-neutral-800 flex flex-col justify-center gap-1 px-1.5">
        <div className="w-5 h-0.5 bg-neutral-400 rounded" /><div className="w-5 h-0.5 bg-neutral-400 rounded" /><div className="w-5 h-0.5 bg-neutral-400 rounded" />
      </div>
    ),
  },
  {
    id: "bottom",
    label: "Embaixo",
    preview: (
      <div className="w-8 h-12 rounded border border-neutral-600 overflow-hidden flex flex-col">
        <div className="flex-1 bg-neutral-600" />
        <div className="h-4 bg-neutral-800 flex flex-col items-center justify-center gap-0.5">
          <div className="w-5 h-0.5 bg-neutral-400 rounded" /><div className="w-4 h-0.5 bg-neutral-500 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "side",
    label: "Lado",
    preview: (
      <div className="w-8 h-12 rounded border border-neutral-600 overflow-hidden flex">
        <div className="w-3 bg-neutral-600" />
        <div className="flex-1 bg-neutral-800 flex flex-col justify-center gap-1 px-1">
          <div className="w-full h-0.5 bg-neutral-400 rounded" /><div className="w-full h-0.5 bg-neutral-400 rounded" /><div className="w-full h-0.5 bg-neutral-400 rounded" />
        </div>
      </div>
    ),
  },
];

/* ─── Shared footer ─── */
function CardFooter({ username, tc }: { username?: string; tc: TextColor }) {
  const nameColor = tc === "white" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <BookOpen size={56} color="#FC5200" strokeWidth={1.5} />
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ color: tc === "white" ? "#fff" : "#111", fontWeight: 800, letterSpacing: "0.15em", fontSize: 12 }}>READSTRAVA</span>
        {username && <span style={{ color: nameColor, fontSize: 10 }}>• @{username}</span>}
      </div>
    </div>
  );
}

/* ─── Card layouts ─── */

function CardCenter({ s, username, tc }: { s: any; username?: string; tc: TextColor }) {
  const stats = [
    { label: "Páginas lidas", value: String(s.pagesRead ?? 0) },
    { label: "Pace", value: s.pacePerHour ? formatPace(s.pacePerHour) : "—" },
    { label: "Tempo total", value: s.durationSeconds ? formatDuration(s.durationSeconds) : "—" },
  ];
  const overlay = tc === "white" ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.82)";
  return (
    <div data-card-root className="relative w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: tc === "white" ? "#111" : "#fff" }}>
      {s.book?.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img data-bg src={s.book.coverUrl} alt="" crossOrigin="anonymous"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)", filter: "blur(20px)" }} />
      )}
      <div data-bg style={{ position: "absolute", inset: 0, background: overlay }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", height: "100%", padding: "32px", textAlign: "center" }}>
        <div style={{ marginTop: 8 }}>
          <p style={{ color: tc === "white" ? "#fff" : "#111", fontWeight: 800, fontSize: 22, lineHeight: 1.2, margin: 0 }}>{s.book?.title}</p>
          <p style={{ color: tc === "white" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)", fontSize: 13, marginTop: 4 }}>{s.book?.author}</p>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, width: "100%" }}>
          {stats.map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ color: tc === "white" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>{label}</p>
              <p style={{ color: tc === "white" ? "#fff" : "#111", fontWeight: 800, fontSize: 48, lineHeight: 1, margin: "4px 0 0" }}>{value}</p>
            </div>
          ))}
        </div>
        <CardFooter username={username} tc={tc} />
      </div>
    </div>
  );
}

function CardLeft({ s, username, tc }: { s: any; username?: string; tc: TextColor }) {
  const stats = [
    { label: "Páginas lidas", value: String(s.pagesRead ?? 0) },
    { label: "Pace", value: s.pacePerHour ? formatPace(s.pacePerHour) : "—" },
    { label: "Tempo total", value: s.durationSeconds ? formatDuration(s.durationSeconds) : "—" },
  ];
  const overlay = tc === "white" ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.82)";
  return (
    <div data-card-root className="relative w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: tc === "white" ? "#111" : "#fff" }}>
      {s.book?.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img data-bg src={s.book.coverUrl} alt="" crossOrigin="anonymous"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)", filter: "blur(20px)" }} />
      )}
      <div data-bg style={{ position: "absolute", inset: 0, background: overlay }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", padding: "32px" }}>
        <div style={{ marginTop: 8 }}>
          <p style={{ color: tc === "white" ? "#fff" : "#111", fontWeight: 800, fontSize: 22, lineHeight: 1.2, margin: 0 }}>{s.book?.title}</p>
          <p style={{ color: tc === "white" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)", fontSize: 13, marginTop: 4 }}>{s.book?.author}</p>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
          {stats.map(({ label, value }) => (
            <div key={label}>
              <p style={{ color: tc === "white" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>{label}</p>
              <p style={{ color: tc === "white" ? "#fff" : "#111", fontWeight: 800, fontSize: 48, lineHeight: 1, margin: "4px 0 0" }}>{value}</p>
            </div>
          ))}
        </div>
        <CardFooter username={username} tc={tc} />
      </div>
    </div>
  );
}

function CardBottom({ s, username, tc }: { s: any; username?: string; tc: TextColor }) {
  const stats = [
    { label: "Páginas", value: String(s.pagesRead ?? 0) },
    { label: "Pace", value: s.pacePerHour ? formatPace(s.pacePerHour) : "—" },
    { label: "Tempo", value: s.durationSeconds ? formatDuration(s.durationSeconds) : "—" },
  ];
  const gradientEnd = tc === "white" ? "#000" : "#fff";
  const gradientMid = tc === "white" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)";
  return (
    <div data-card-root style={{ position: "relative", width: "100%", height: "100%", backgroundColor: tc === "white" ? "#000" : "#fff", overflow: "hidden" }}>
      {s.book?.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img data-bg src={s.book.coverUrl} alt="" crossOrigin="anonymous"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "65%", objectFit: "cover" }} />
      )}
      <div data-bg style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${gradientEnd} 35%, ${gradientMid} 60%, transparent 100%)` }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 32px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          {stats.map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ color: tc === "white" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{label}</p>
              <p style={{ color: tc === "white" ? "#fff" : "#111", fontWeight: 800, fontSize: 28, margin: "2px 0 0" }}>{value}</p>
            </div>
          ))}
        </div>
        <p style={{ color: tc === "white" ? "#fff" : "#111", fontWeight: 800, fontSize: 18, margin: "0 0 2px" }}>{s.book?.title}</p>
        <p style={{ color: tc === "white" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 12, margin: "0 0 16px" }}>{s.book?.author}</p>
        <CardFooter username={username} tc={tc} />
      </div>
    </div>
  );
}

function CardSide({ s, username, tc }: { s: any; username?: string; tc: TextColor }) {
  const stats = [
    { label: "Páginas lidas", value: String(s.pagesRead ?? 0) },
    { label: "Pace", value: s.pacePerHour ? formatPace(s.pacePerHour) : "—" },
    { label: "Tempo total", value: s.durationSeconds ? formatDuration(s.durationSeconds) : "—" },
  ];
  const panelBg = tc === "white" ? "#111" : "#f5f5f5";
  return (
    <div data-card-root style={{ position: "relative", width: "100%", height: "100%", backgroundColor: panelBg, display: "flex", overflow: "hidden" }}>
      <div data-bg style={{ width: "42%", position: "relative", overflow: "hidden" }}>
        {s.book?.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.book.coverUrl} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={32} color="#FC5200" />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: tc === "white" ? "linear-gradient(to right, transparent, rgba(17,17,17,0.6))" : "linear-gradient(to right, transparent, rgba(245,245,245,0.6))" }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 24px", gap: 24, backgroundColor: panelBg }}>
        <div>
          <p style={{ color: tc === "white" ? "#fff" : "#111", fontWeight: 800, fontSize: 15, lineHeight: 1.25, margin: 0 }}>{s.book?.title}</p>
          <p style={{ color: tc === "white" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", fontSize: 11, margin: "4px 0 0" }}>{s.book?.author}</p>
        </div>
        {stats.map(({ label, value }) => (
          <div key={label}>
            <p style={{ color: tc === "white" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{label}</p>
            <p style={{ color: "#FC5200", fontWeight: 800, fontSize: 30, margin: "2px 0 0", lineHeight: 1 }}>{value}</p>
          </div>
        ))}
        <CardFooter username={username} tc={tc} />
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { request } = useApi();
  const { user } = useAuth();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cardLayout, setCardLayout] = useState<CardLayout>("center");
  const [textColor, setTextColor] = useState<TextColor>("white");
  const [downloading, setDownloading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    startPage: "", endPage: "",
    durationHours: "", durationMinutes: "",
    mood: null as number | null,
    locationTag: "", highlight: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request(`/api/sessions/${sessionId}`).then((r) => r.json()).then((d) => {
      setData(d);
      if (d.session) {
        const s = d.session;
        const totalMin = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0;
        setEditForm({
          startPage: String(s.startPage ?? ""), endPage: String(s.endPage ?? ""),
          durationHours: String(Math.floor(totalMin / 60) || ""),
          durationMinutes: String(totalMin % 60 || ""),
          mood: s.mood ?? null,
          locationTag: s.locationTag ?? "", highlight: s.highlight ?? "",
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

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");

      const bgEls = cardRef.current.querySelectorAll<HTMLElement>("[data-bg]");
      bgEls.forEach((el) => { el.style.display = "none"; });

      const rootEls = cardRef.current.querySelectorAll<HTMLElement>("[data-card-root]");
      const prevBgs: string[] = [];
      rootEls.forEach((el) => { prevBgs.push(el.style.backgroundColor); el.style.backgroundColor = "transparent"; });

      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });

      bgEls.forEach((el) => { el.style.display = ""; });
      rootEls.forEach((el, i) => { el.style.backgroundColor = prevBgs[i]; });

      const a = document.createElement("a");
      a.download = `readstrava-${(s.book?.title ?? "sessao").replace(/\s+/g, "-").slice(0, 40)}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      alert("Erro ao gerar imagem. Tente fazer um screenshot.");
    }
    setDownloading(false);
  };

  if (loading) return <div className="p-4"><div className="bg-neutral-900 h-64 rounded-2xl animate-pulse" /></div>;
  if (!data?.session) return <div className="p-4 text-center text-neutral-500">Sessão não encontrada</div>;

  const s = data.session;

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

      <div className="p-4 flex flex-col gap-4">

        {/* Layout selector */}
        <div className="flex gap-2">
          {LAYOUTS.map(({ id, label, preview }) => (
            <button key={id} onClick={() => setCardLayout(id)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl border transition-colors ${
                cardLayout === id ? "border-[#FC5200] bg-[#FC5200]/10" : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
              }`}>
              {preview}
              <span className={`text-[10px] font-semibold ${cardLayout === id ? "text-[#FC5200]" : "text-neutral-500"}`}>{label}</span>
            </button>
          ))}
        </div>

        {/* Text color toggle */}
        <div className="flex gap-2">
          <button onClick={() => setTextColor("white")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              textColor === "white" ? "bg-neutral-100 text-neutral-900 border-neutral-100" : "bg-neutral-900 text-neutral-400 border-neutral-800"
            }`}>
            Texto branco
          </button>
          <button onClick={() => setTextColor("black")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              textColor === "black" ? "bg-neutral-900 text-white border-white" : "bg-neutral-900 text-neutral-400 border-neutral-800"
            }`}>
            Texto preto
          </button>
        </div>

        {/* Card */}
        <div className="w-full max-w-xs mx-auto">
          <div ref={cardRef} className="w-full rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: "9/16" }}>
            {cardLayout === "center" && <CardCenter s={s} username={user?.username} tc={textColor} />}
            {cardLayout === "left"   && <CardLeft   s={s} username={user?.username} tc={textColor} />}
            {cardLayout === "bottom" && <CardBottom s={s} username={user?.username} tc={textColor} />}
            {cardLayout === "side"   && <CardSide   s={s} username={user?.username} tc={textColor} />}
          </div>
        </div>

        {/* Download */}
        <button onClick={downloadCard} disabled={downloading}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-[#FC5200] hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl py-3 transition-colors">
          <Download size={18} />
          {downloading ? "Gerando PNG..." : "Baixar PNG transparente"}
        </button>

        <p className="text-xs text-neutral-600 text-center">Sobreponha o PNG na sua foto favorita ✨</p>

        {/* Detalhes */}
        <div className="flex flex-wrap gap-3 text-sm text-neutral-400 pt-1">
          {s.mood && <span>Humor: {MOOD_ICONS[s.mood]}</span>}
          {s.locationTag && <span>{LOCATIONS.find((l) => l.value === s.locationTag)?.label ?? s.locationTag}</span>}
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
            <input type="text" value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Adicionar comentário..." maxLength={500}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[#FC5200] focus:outline-none" />
            <button type="submit" disabled={submitting || !comment.trim()}
              className="w-12 h-12 bg-[#FC5200] hover:bg-orange-400 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors">
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
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-neutral-800 rounded-xl"><X size={18} /></button>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Pág. inicial</label>
                <input type="number" value={editForm.startPage} onChange={(e) => setEditForm((p) => ({ ...p, startPage: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Pág. final</label>
                <input type="number" value={editForm.endPage} onChange={(e) => setEditForm((p) => ({ ...p, endPage: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Tempo de leitura</label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input type="number" value={editForm.durationHours} placeholder="0" min={0}
                    onChange={(e) => setEditForm((p) => ({ ...p, durationHours: e.target.value }))}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none pr-14" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500">horas</span>
                </div>
                <div className="flex-1 relative">
                  <input type="number" value={editForm.durationMinutes} placeholder="0" min={0} max={59}
                    onChange={(e) => setEditForm((p) => ({ ...p, durationMinutes: e.target.value }))}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none pr-10" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500">min</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-2">Humor</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setEditForm((p) => ({ ...p, mood: p.mood === n ? null : n }))}
                    className={`flex-1 py-2 rounded-xl text-xl transition-colors ${editForm.mood === n ? "bg-[#FC5200]/20 ring-1 ring-[#FC5200]" : "bg-neutral-800 hover:bg-neutral-700"}`}>
                    {MOOD_ICONS[n]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-2">Local</label>
              <div className="grid grid-cols-2 gap-2">
                {LOCATIONS.map(({ value, label }) => (
                  <button key={value} onClick={() => setEditForm((p) => ({ ...p, locationTag: p.locationTag === value ? "" : value }))}
                    className={`py-2 px-3 rounded-xl text-sm transition-colors ${editForm.locationTag === value ? "bg-[#FC5200]/20 text-[#FC5200] ring-1 ring-[#FC5200]" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Destaque / citação</label>
              <textarea value={editForm.highlight} onChange={(e) => setEditForm((p) => ({ ...p, highlight: e.target.value }))}
                rows={2} maxLength={1000} placeholder="Uma frase marcante..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none resize-none text-sm" />
            </div>
            <button onClick={saveEdit} disabled={saving || !editForm.startPage || !editForm.endPage}
              className="w-full bg-[#FC5200] hover:bg-orange-400 disabled:opacity-40 text-white font-bold rounded-xl py-3">
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
