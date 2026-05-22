"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil, LogOut, BookOpen, Clock, X, Globe, Lock } from "lucide-react";
import { formatDuration, formatPages, timeAgo } from "@/lib/utils";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { request } = useApi();
  const { user: currentUser, logout, updateUser } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "", isPublic: true });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    request(`/api/users/${username}`).then((r) => r.json()).then((d) => {
      setData(d);
      setFollowing(d.isFollowing ?? false);
      if (d.user) setEditForm({ name: d.user.name, bio: d.user.bio ?? "", isPublic: d.user.isPublic });
      setLoading(false);
    });
  }, [username]);

  useEffect(() => {
    if (data?.isOwner) {
      request("/api/sessions?limit=10").then((r) => r.json()).then((d) => setSessions(d.sessions ?? []));
    }
  }, [data?.isOwner]);

  const toggleFollow = async () => {
    const res = await request(`/api/users/${username}/follow`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setFollowing(d.following);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setEditError("");
    const res = await request("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const d = await res.json();
      setData((prev: any) => ({ ...prev, user: { ...prev.user, ...d.user } }));
      updateUser({ name: d.user.name, isPublic: d.user.isPublic, avatarUrl: d.user.avatarUrl });
      setShowEdit(false);
    } else {
      const d = await res.json().catch(() => ({}));
      setEditError(d.error ?? "Erro ao salvar");
    }
    setSaving(false);
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
          <button onClick={() => setShowEdit(true)} className="p-2 rounded-xl hover:bg-neutral-800">
            <Pencil size={18} className="text-neutral-400" />
          </button>
        )}
      </header>

      {/* Avatar + info */}
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
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xl">{user.name}</h2>
            {isOwner && (
              user.isPublic
                ? <Globe size={13} className="text-neutral-500" />
                : <Lock size={13} className="text-neutral-500" />
            )}
          </div>
          {user.bio && <p className="text-sm text-neutral-400 mt-0.5">{user.bio}</p>}
          <div className="flex gap-4 mt-2 text-sm">
            <span><strong>{stats.followersCount}</strong> <span className="text-neutral-500">seguidores</span></span>
            <span><strong>{stats.followingCount}</strong> <span className="text-neutral-500">seguindo</span></span>
          </div>
        </div>
      </div>

      {/* Follow button */}
      {!isOwner && (
        <div className="px-4 mb-4">
          <button
            onClick={toggleFollow}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
              following
                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                : "bg-[#FC5200] text-white hover:bg-orange-400"
            }`}
          >
            {following ? "Deixar de seguir" : "Seguir"}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-6">
        {[
          { label: "Livros lidos", value: String(stats.completedBooks), icon: BookOpen },
          { label: "Páginas", value: formatPages(stats.totalPages), icon: BookOpen },
          { label: "Tempo total", value: formatDuration(stats.totalTimeSeconds), icon: Clock },
        ].map(({ label, value }) => (
          <div key={label} className="bg-neutral-900 rounded-2xl p-3 text-center border border-neutral-800">
            <p className="text-xl font-bold text-[#FC5200]">{value}</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Conquistas */}
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

      {/* Atividades recentes (só dono) */}
      {isOwner && sessions.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="font-semibold mb-3">Atividades recentes</h2>
          <div className="flex flex-col gap-2">
            {sessions.map((s: any) => (
              <Link
                key={s.id}
                href={`/session/${s.id}`}
                className="flex items-center gap-3 p-3 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <div className="w-9 h-12 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                  {s.book?.coverUrl ? (
                    <Image src={s.book.coverUrl} alt={s.book.title} width={36} height={48} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={12} className="text-neutral-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.book?.title}</p>
                  <div className="flex gap-3 text-xs text-neutral-500 mt-0.5">
                    <span>{s.pagesRead ?? 0} págs</span>
                    {s.durationSeconds && <span>{formatDuration(s.durationSeconds)}</span>}
                  </div>
                </div>
                <span className="text-[10px] text-neutral-600 flex-shrink-0">{timeAgo(s.startedAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modal editar perfil */}
      {showEdit && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end" onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="bg-neutral-900 w-full max-w-lg mx-auto rounded-t-2xl p-5 flex flex-col gap-4" style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Editar perfil</h2>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-neutral-800 rounded-xl">
                <X size={18} />
              </button>
            </div>

            {editError && <p className="text-red-400 text-sm">{editError}</p>}

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Nome</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                maxLength={100}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                maxLength={300}
                placeholder="Fale um pouco sobre você..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-[#FC5200] focus:outline-none resize-none text-sm"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl">
              <div>
                <p className="font-semibold text-sm">Perfil público</p>
                <p className="text-xs text-neutral-500">Outros usuários podem ver sua atividade</p>
              </div>
              <button
                onClick={() => setEditForm((p) => ({ ...p, isPublic: !p.isPublic }))}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${editForm.isPublic ? "bg-[#FC5200]" : "bg-neutral-600"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.isPublic ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving || !editForm.name.trim()}
              className="w-full bg-[#FC5200] hover:bg-orange-400 disabled:opacity-40 text-white font-bold rounded-xl py-3"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>

            <button
              onClick={async () => { await logout(); router.replace("/login"); }}
              className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:text-red-300 text-sm"
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
