"use client";

import Image from "next/image";
import Link from "next/link";
import { BookmarkIcon, MessageCircle, Clock, BookOpen } from "lucide-react";
import { formatDuration, formatPace, timeAgo } from "@/lib/utils";
import { useState } from "react";
import { useApi } from "@/hooks/useApi";

interface SessionCardProps {
  session: {
    id: string;
    pagesRead: number | null;
    durationSeconds: number | null;
    pacePerHour: number | null;
    endedAt: string | null;
    highlight: string | null;
    photoUrl: string | null;
    hasKudos: boolean;
    kudosCount: number;
    commentsCount: number;
    user: { username: string; name: string; avatarUrl: string | null };
    book: { id: string; title: string; author: string; coverUrl: string | null };
  };
}

export function SessionCard({ session: s }: SessionCardProps) {
  const { request } = useApi();
  const [kudosed, setKudosed] = useState(s.hasKudos);
  const [kudosCount, setKudosCount] = useState(s.kudosCount);

  const toggleKudos = async () => {
    const res = await request(`/api/sessions/${s.id}/kudos`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setKudosed(data.kudosed);
      setKudosCount((c) => (data.kudosed ? c + 1 : c - 1));
    }
  };

  return (
    <article className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/profile/${s.user.username}`}>
            <div className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
              {s.user.avatarUrl ? (
                <Image src={s.user.avatarUrl} alt={s.user.name} width={40} height={40} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold text-sm">
                  {s.user.name[0].toUpperCase()}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${s.user.username}`} className="font-semibold text-sm hover:text-orange-400 transition-colors">
              {s.user.name}
            </Link>
            <p className="text-xs text-neutral-500">{s.endedAt ? timeAgo(s.endedAt) : ""}</p>
          </div>
          <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
            {s.book.coverUrl ? (
              <Image src={s.book.coverUrl} alt={s.book.title} width={40} height={56} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen size={16} className="text-neutral-600" />
              </div>
            )}
          </div>
        </div>

        <Link href={`/library/${s.book.id}`} className="block mb-3">
          <p className="font-semibold text-sm leading-tight hover:text-orange-400 transition-colors">{s.book.title}</p>
          <p className="text-xs text-neutral-500">{s.book.author}</p>
        </Link>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-neutral-800 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold text-orange-400">{s.pagesRead ?? 0}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide">páginas</p>
          </div>
          <div className="bg-neutral-800 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold">{s.durationSeconds ? formatDuration(s.durationSeconds) : "—"}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide">tempo</p>
          </div>
          <div className="bg-neutral-800 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold">{s.pacePerHour ? formatPace(s.pacePerHour) : "—"}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide">pace</p>
          </div>
        </div>

        {s.highlight && (
          <blockquote className="border-l-2 border-orange-500 pl-3 mb-3">
            <p className="text-sm text-neutral-300 italic line-clamp-2">"{s.highlight}"</p>
          </blockquote>
        )}

        {s.photoUrl && (
          <div className="rounded-xl overflow-hidden mb-3 aspect-video relative bg-neutral-800">
            <Image src={s.photoUrl} alt="foto da sessão" fill className="object-cover" />
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex items-center gap-4 border-t border-neutral-800 pt-3">
        <button
          onClick={toggleKudos}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors min-h-[44px] px-1 ${
            kudosed ? "text-orange-400" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <BookmarkIcon size={18} fill={kudosed ? "currentColor" : "none"} />
          <span>{kudosCount > 0 ? kudosCount : ""} Kudos</span>
        </button>
        <Link
          href={`/session/${s.id}`}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors min-h-[44px] px-1"
        >
          <MessageCircle size={18} />
          <span>{s.commentsCount > 0 ? s.commentsCount : ""} Comentar</span>
        </Link>
      </div>
    </article>
  );
}

