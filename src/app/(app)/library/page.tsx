"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import Image from "next/image";
import Link from "next/link";
import { Plus, BookOpen, Search, X, ChevronDown } from "lucide-react";

type BookStatus = "READING" | "COMPLETED" | "PAUSED" | "WISHLIST";
type AddMode = "search" | "manual";

const STATUS_LABELS: Record<BookStatus, string> = {
  READING: "Lendo", COMPLETED: "Concluído", PAUSED: "Pausado", WISHLIST: "Quero ler",
};
const STATUS_COLORS: Record<BookStatus, string> = {
  READING: "text-[#FC5200]", COMPLETED: "text-blue-600", PAUSED: "text-yellow-600", WISHLIST: "text-gray-400",
};

const emptyManual = { title: "", author: "", totalPages: "", genre: "", isbn: "" };

export default function LibraryPage() {
  const { request } = useApi();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookStatus | "">("");
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("search");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addStatus, setAddStatus] = useState<BookStatus>("READING");
  const [manual, setManual] = useState(emptyManual);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadBooks = async (status?: string) => {
    setLoading(true);
    const q = status ? `?status=${status}&limit=50` : "?limit=50";
    const res = await request(`/api/books${q}`);
    const data = await res.json();
    setBooks(data.books ?? []);
    setLoading(false);
  };

  useEffect(() => { loadBooks(filter); }, [filter]);

  const doSearch = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await request(`/api/books/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults(data.books ?? []);
    setSearching(false);
  };

  const addFromSearch = async (b: any) => {
    setSaving(true);
    setError("");
    const res = await request("/api/books", {
      method: "POST",
      body: JSON.stringify({
        title: b.title, author: b.author,
        totalPages: b.totalPages ?? 200,
        coverUrl: b.coverUrl, isbn: b.isbn,
        genre: b.genre, googleBooksId: b.googleBooksId,
        status: addStatus,
      }),
    });
    if (res.ok) {
      closeModal();
      loadBooks(filter);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erro ao adicionar");
    }
    setSaving(false);
  };

  const addManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manual.title || !manual.author || !manual.totalPages) {
      setError("Título, autor e número de páginas são obrigatórios");
      return;
    }
    setSaving(true);
    setError("");
    const res = await request("/api/books", {
      method: "POST",
      body: JSON.stringify({
        title: manual.title,
        author: manual.author,
        totalPages: parseInt(manual.totalPages),
        genre: manual.genre || null,
        isbn: manual.isbn || null,
        status: addStatus,
      }),
    });
    if (res.ok) {
      closeModal();
      loadBooks(filter);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erro ao adicionar");
    }
    setSaving(false);
  };

  const closeModal = () => {
    setShowAdd(false);
    setSearch("");
    setSearchResults([]);
    setManual(emptyManual);
    setError("");
    setAddMode("search");
  };

  const setM = (k: keyof typeof emptyManual) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setManual((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-xl text-[#353633]">Biblioteca</h1>
        <button onClick={() => setShowAdd(true)} className="w-9 h-9 bg-[#FC5200] rounded flex items-center justify-center">
          <Plus size={18} className="text-white" />
        </button>
      </header>

      {/* Filtros */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {(["", "READING", "COMPLETED", "PAUSED", "WISHLIST"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded text-sm font-semibold transition-colors border ${
              filter === s
                ? "bg-[#FC5200] text-white border-[#FC5200]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s === "" ? "Todos" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-4 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white border border-gray-200 rounded h-52 animate-pulse" />)}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 px-4">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="font-bold text-[#353633] mb-2">Biblioteca vazia</h2>
          <p className="text-sm text-gray-500 mb-6">Adicione seu primeiro livro</p>
          <button onClick={() => setShowAdd(true)} className="bg-[#FC5200] text-white font-bold rounded px-6 py-3 uppercase tracking-wide text-sm">
            Adicionar livro
          </button>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-4">
          {books.map((b) => (
            <Link key={b.id} href={`/library/${b.id}`} className="bg-white border border-gray-200 rounded overflow-hidden hover:border-[#FC5200] transition-colors">
              <div className="aspect-[2/3] relative bg-gray-100">
                {b.coverUrl ? (
                  <Image src={b.coverUrl} alt={b.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={32} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-[#FC5200] rounded px-1.5 py-0.5">
                  <p className="text-[10px] font-bold text-white">{b.progressPercent ?? 0}%</p>
                </div>
              </div>
              <div className="p-3">
                <p className="font-bold text-sm text-[#353633] leading-tight line-clamp-2">{b.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{b.author}</p>
                <p className={`text-xs font-semibold mt-1 ${STATUS_COLORS[b.status as BookStatus]}`}>
                  {STATUS_LABELS[b.status as BookStatus]}
                </p>
                {b.status === "READING" && (
                  <div className="mt-2 bg-gray-100 rounded-full h-1">
                    <div className="bg-[#FC5200] h-full rounded-full" style={{ width: `${b.progressPercent ?? 0}%` }} />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-xl shadow-xl" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-bold text-lg text-[#353633]">Adicionar livro</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {(["search", "manual"] as AddMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setAddMode(m); setError(""); }}
                  className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${
                    addMode === m ? "border-[#FC5200] text-[#FC5200]" : "border-transparent text-gray-400"
                  }`}
                >
                  {m === "search" ? "🔍 Buscar" : "✏️ Cadastro manual"}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Status selector */}
              <div className="flex gap-2">
                {(["READING", "WISHLIST", "COMPLETED"] as BookStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setAddStatus(s)}
                    className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wide transition-colors border ${
                      addStatus === s ? "bg-[#FC5200] text-white border-[#FC5200]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-3 py-2">{error}</div>
              )}

              {addMode === "search" ? (
                <>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); doSearch(e.target.value); }}
                      placeholder="Buscar por título ou autor..."
                      autoFocus
                      className="w-full bg-white border border-gray-300 rounded pl-9 pr-4 py-3 text-[#353633] placeholder-gray-400 focus:border-[#FC5200] focus:outline-none"
                    />
                  </div>

                  {searching && <p className="text-center text-sm text-gray-400 py-2">Buscando...</p>}

                  {!searching && search.length > 1 && searchResults.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-2">
                      Nenhum resultado.{" "}
                      <button onClick={() => setAddMode("manual")} className="text-[#FC5200] font-semibold">
                        Cadastrar manualmente?
                      </button>
                    </p>
                  )}

                  <div className="flex flex-col gap-2 pb-2">
                    {searchResults.map((b) => (
                      <button
                        key={b.googleBooksId}
                        onClick={() => addFromSearch(b)}
                        disabled={saving}
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded hover:border-[#FC5200] transition-colors text-left"
                      >
                        <div className="w-10 h-14 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                          {b.coverUrl ? (
                            <Image src={b.coverUrl} alt={b.title} width={40} height={56} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={14} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#353633] line-clamp-2">{b.title}</p>
                          <p className="text-xs text-gray-400">{b.author}</p>
                          {b.totalPages && <p className="text-xs text-gray-300">{b.totalPages} páginas</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <form onSubmit={addManual} className="flex flex-col gap-3 pb-2">
                  {[
                    { key: "title", label: "Título *", placeholder: "Ex: O Senhor dos Anéis" },
                    { key: "author", label: "Autor *", placeholder: "Ex: J.R.R. Tolkien" },
                    { key: "totalPages", label: "Número de páginas *", placeholder: "Ex: 576", type: "number" },
                    { key: "genre", label: "Gênero", placeholder: "Ex: Fantasia" },
                    { key: "isbn", label: "ISBN", placeholder: "Ex: 978-85..." },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                      <input
                        type={type ?? "text"}
                        value={manual[key as keyof typeof emptyManual]}
                        onChange={setM(key as keyof typeof emptyManual)}
                        placeholder={placeholder}
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2.5 text-[#353633] placeholder-gray-400 focus:border-[#FC5200] focus:outline-none text-sm"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#FC5200] hover:bg-[#e04900] disabled:opacity-50 text-white font-bold rounded py-3 uppercase tracking-wide text-sm mt-2"
                  >
                    {saving ? "Salvando..." : "Adicionar livro"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
