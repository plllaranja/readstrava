"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { ArrowLeft, Settings, BookOpen, Clock, Users } from "lucide-react";
import { formatDuration, formatPages } from "@/lib/utils";
import Link from "next/link";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { request } = useApi();
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    request(`/api/users/${username}`).then((r) => r.json()).then((d) => {
      setData(d);
      setFollowing(d.isFollowing ?? false);
      setLoading(false);
    });
  }, [username]);

  const toggleFollow = async () => {
    const res = await request(`/api/users/${username}/follow`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setFollowing(d.following);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div className="bg-neutral-900 h-40 rounded-2xl animate-pulse" />
        <div className="bg-neutral-900 h-24 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data?.user) return <div className="p-4 text-center text-neutral-500">Usuário não encontrado</div>;

  const { user, stats, isOwner } = data;

  return (
    <div>
      <header className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-neutral-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg flex-1">@{user.username}</h1>
        {isOwner && (
          <button onClick={logout} className="p-2 rounded-xl hover:bg-neutral-800">
            <Settings size={20} className="text-neutral-400" />
          </button>
        )}
      </header>

      <div className="px-4 pb-4 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.name} width={80} height={80} className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-neutral-500">
              {user.name[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-xl">{user.name}</h2>
          {user.bio && <p className="text-sm text-neutral-400 mt-1">{user.bio}</p>}
          <div className="flex gap-4 mt-2 text-sm">
            <span><strong>{stats.followersCount}</strong> <span className="text-neutral-500">seguidores</span></span>
            <span><strong>{stats.followingCount}</strong> <span className="text-neutral-500">seguindo</span></span>
          </div>
        </div>
      </div>

      {!isOwner && (
        <div className="px-4 mb-4">
          <button
            onClick={toggleFollow}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
              following
                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                : "bg-emerald-500 text-white hover:bg-emerald-400"
            }`}
          >
            {following ? "Deixar de seguir" : "Seguir"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 px-4 mb-6">
        {[
          { label: "Livros lidos", value: stats.completedBooks, icon: BookOpen },
          { label: "Páginas", value: formatPages(stats.totalPages), icon: BookOpen },
          { label: "Tempo total", value: formatDuration(stats.totalTimeSeconds), icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-neutral-900 rounded-2xl p-3 text-center border border-neutral-800">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {data.achievements?.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="font-semibold mb-3">Conquistas</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {data.achievements.map((a: any) => (
              <div key={a.id} className="flex-shrink-0 flex flex-col items-center gap-1 p-2 bg-neutral-900 rounded-xl border border-neutral-800 w-16">
                <span className="text-xl">{a.meta?.icon ?? "⭐"}</span>
                <p className="text-[9px] text-center text-neutral-400 leading-tight">{a.meta?.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
