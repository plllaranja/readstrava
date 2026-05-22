"use client";

import { useState, useEffect, useRef } from "react";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, BookOpen, Clock, ChevronDown } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import Image from "next/image";

type Mode = "select" | "timer" | "manual" | "complete";

export default function RecordPage() {
  const { request } = useApi();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("select");
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [highlight, setHighlight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    request("/api/books?status=READING&limit=20").then((r) => r.json()).then((d) => setBooks(d.books ?? []));
  }, []);

  useEffect(() => {
    if (activeSession && !isPaused) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeSession, isPaused]);

  const startTimer = async () => {
    if (!selectedBook || !startPage) return;
    setSubmitting(true);
    const res = await request("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ mode: "timer_start", bookId: selectedBook.id, startPage: parseInt(startPage) }),
    });
    if (res.ok) {
      const data = await res.json();
      setActiveSession(data.session);
      setElapsed(0);
      setMode("timer");
    }
    setSubmitting(false);
  };

  const stopTimer = async () => {
    if (!activeSession || !endPage) return;
    setSubmitting(true);
    const res = await request(`/api/sessions/${activeSession.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "stop",
        endPage: parseInt(endPage),
        mood: mood ?? undefined,
        locationTag: location || undefined,
        highlight: highlight || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.newAchievements?.length > 0) {
        alert(`🏆 Nova conquista: ${data.newAchievements.join(", ")}`);
      }
      router.push(`/session/${activeSession.id}`);
    }
    setSubmitting(false);
  };

  const submitManual = async () => {
    if (!selectedBook || !startPage || !endPage) return;
    setSubmitting(true);
    const res = await request("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        bookId: selectedBook.id,
        startPage: parseInt(startPage),
        endPage: parseInt(endPage),
        startedAt: new Date().toISOString(),
        mood: mood ?? undefined,
        locationTag: location || undefined,
        highlight: highlight || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/session/${data.session.id}`);
    }
    setSubmitting(false);
  };

  if (!activeSession) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Registrar leitura</h1>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode("timer")}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
              mode === "timer" ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-300"
            }`}
          >
            ⏱ Timer
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
              mode === "manual" ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-300"
            }`}
          >
            ✏️ Manual
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <label className="text-sm font-medium text-neutral-300">Selecionar livro</label>
          {books.length === 0 ? (
            <div className="bg-neutral-900 rounded-xl p-4 text-center text-sm text-neutral-500">
              Nenhum livro em leitura.{" "}
              <a href="/library" className="text-orange-400">Adicionar livro</a>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {books.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBook(b)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                    selectedBook?.id === b.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                  }`}
                >
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                    {b.coverUrl ? (
                      <Image src={b.coverUrl} alt={b.title} width={40} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={14} className="text-neutral-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{b.title}</p>
                    <p className="text-xs text-neutral-500">{b.author}</p>
                    <div className="mt-1 bg-neutral-800 rounded-full h-1.5 w-full">
                      <div
                        className="bg-orange-500 h-full rounded-full"
                        style={{ width: `${b.progressPercent ?? 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{b.progressPercent ?? 0}% • pág. {b.pagesRead ?? 0}/{b.totalPages}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedBook && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-neutral-300 block mb-1.5">Página inicial</label>
                <input
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  min={0}
                  max={selectedBook.totalPages}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  placeholder={`${selectedBook.pagesRead ?? 0}`}
                />
              </div>
              {mode === "manual" && (
                <div className="flex-1">
                  <label className="text-sm font-medium text-neutral-300 block mb-1.5">Página final</label>
                  <input
                    type="number"
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value)}
                    min={0}
                    max={selectedBook.totalPages}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <button
              onClick={mode === "timer" ? startTimer : submitManual}
              disabled={submitting || !startPage || (mode === "manual" && !endPage)}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl py-4 text-lg transition-colors"
            >
              {mode === "timer" ? "▶ Iniciar timer" : "Registrar sessão"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (mode === "timer" && activeSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
        <div className="text-center">
          <div className="w-16 h-22 mx-auto rounded-xl overflow-hidden bg-neutral-800 mb-4">
            {activeSession.book?.coverUrl && (
              <Image src={activeSession.book.coverUrl} alt="" width={64} height={88} className="object-cover w-full h-full" />
            )}
          </div>
          <h2 className="font-bold text-lg">{activeSession.book?.title}</h2>
          <p className="text-sm text-neutral-500">{activeSession.book?.author}</p>
        </div>

        <div className="text-center">
          <p className="text-7xl font-mono font-bold tabular-nums">{formatDuration(elapsed)}</p>
          <p className="text-neutral-500 text-sm mt-2">sessão ativa</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="w-16 h-16 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            {isPaused ? <Play size={24} /> : <Pause size={24} />}
          </button>
          <button
            onClick={() => setMode("complete" as Mode)}
            className="w-16 h-16 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors"
          >
            <Square size={24} />
          </button>
        </div>

        {mode === ("complete" as any) && (
          <div className="w-full flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-300 block mb-1.5">Página final</label>
              <input
                type="number"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <button onClick={stopTimer} disabled={submitting || !endPage} className="w-full bg-orange-500 text-white font-bold rounded-xl py-4">
              Finalizar sessão
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

