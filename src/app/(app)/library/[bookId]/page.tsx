"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, BookOpen, Clock, TrendingUp, Star, Calendar } from "lucide-react";
import { formatDuration, formatPace, timeAgo } from "@/lib/utils";
import Link from "next/link";

const MOOD_ICONS = ["", "😴", "😐", "🙂", "😊", "🔥"];
const STATUS_LABELS: Record<string, string> = {
  READING: "Lendo", COMPLETED: "Concluído", PAUSED: "Pausado", WISHLIST: "Quero ler",
};

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { request } = useApi();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request(`/api/books/${bookId}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [bookId]);

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div className="bg-neutral-900 h-64 rounded-2xl animate-pulse" />
        <div className="bg-neutral-900 h-32 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data?.book) return <div className="p-4 text-center text-neutral-500">Livro não encontrado</div>;

  const { book, sessions } = data;

  return (
    <div>
      <div className="relative">
        <div className="h-56 bg-neutral-900 relative overflow-hidden">
          {book.coverUrl && (
            <Image src={book.coverUrl} alt={book.title} fill className="object-cover opacity-20 blur-xl scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-950" />
        </div>

        <button onClick={() => router.back()} className="absolute top-4 left-4 p-2 bg-neutral-900/80 rounded-xl backdrop-blur-sm">
          <ArrowLeft size={20} />
        </button>

        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          <div className="w-20 h-28 rounded-xl overflow-hidden shadow-xl flex-shrink-0 bg-neutral-800">
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt={book.title} width={80} height={112} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen size={28} className="text-neutral-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight">{book.title}</h1>
            <p className="text-sm text-neutral-400">{book.author}</p>
            <p className="text-xs text-neutral-500 mt-1">{STATUS_LABELS[book.status]}</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div>
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <span>{book.pagesRead} de {book.totalPages} páginas</span>
            <span>{book.progressPercent}%</span>
          </div>
          <div className="bg-neutral-800 rounded-full h-2">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${book.progressPercent}%` }} />
          </div>
          {book.estimatedDaysLeft && (
            <p className="text-xs text-neutral-500 mt-1">
              📅 Previsão: ~{book.estimatedDaysLeft} dias para concluir
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Páginas", value: book.pagesRead, icon: BookOpen },
            { label: "Tempo total", value: formatDuration(book.totalTimeSeconds), icon: Clock },
            { label: "Pace médio", value: formatPace(book.avgPacePerHour), icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-neutral-900 rounded-xl p-3 text-center border border-neutral-800">
              <Icon size={16} className="text-emerald-400 mx-auto mb-1" />
              <p className="font-bold text-sm">{value}</p>
              <p className="text-[10px] text-neutral-500">{label}</p>
            </div>
          ))}
        </div>

        {book.rating && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={16} className={i <= book.rating ? "text-yellow-400 fill-yellow-400" : "text-neutral-700"} />
            ))}
            <span className="text-sm text-neutral-500 ml-1">{book.rating}/5</span>
          </div>
        )}

        {book.review && (
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
            <p className="text-sm font-semibold text-neutral-300 mb-2">Resenha</p>
            <p className="text-sm text-neutral-400">{book.review}</p>
          </div>
        )}

        {book.status === "READING" && (
          <Link href="/record" className="block w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-center rounded-xl py-4 transition-colors">
            ▶ Iniciar leitura
          </Link>
        )}

        <div>
          <h2 className="font-bold text-lg mb-3">Sessões ({sessions?.length ?? 0})</h2>
          <div className="flex flex-col gap-3">
            {(sessions ?? []).map((s: any) => (
              <Link key={s.id} href={`/session/${s.id}`} className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{s.pagesRead ?? 0} páginas</p>
                  <p className="text-xs text-neutral-500">{s.endedAt ? timeAgo(s.endedAt) : "em andamento"}</p>
                </div>
                <div className="flex gap-4 text-xs text-neutral-500">
                  <span>⏱ {s.durationSeconds ? formatDuration(s.durationSeconds) : "—"}</span>
                  <span>📖 {s.pacePerHour ? formatPace(s.pacePerHour) : "—"}</span>
                  {s.mood && <span>{MOOD_ICONS[s.mood]}</span>}
                  {s.locationTag && <span>📍 {s.locationTag}</span>}
                </div>
                {s.highlight && (
                  <p className="text-xs text-neutral-400 italic mt-2 line-clamp-1">"{s.highlight}"</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
