"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import Image from "next/image";
import Link from "next/link";
import { Plus, BookOpen, Search, X } from "lucide-react";

type BookStatus = "READING" | "COMPLETED" | "PAUSED" | "WISHLIST";

const STATUS_LABELS: Record<BookStatus, string> = {
  READING: "Lendo",
  COMPLETED: "Concluído",
  PAUSED: "Pausado",
  WISHLIST: "Quero ler",
};

const STATUS_COLORS: Record<BookStatus, string> = {
  READING: "text-orange-400",
  COMPLETED: "text-blue-400",
  PAUSED: "text-yellow-400",
  WISHLIST: "text-neutral-400",
};

export default function LibraryPage() {
  const { request } = useApi();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookStatus | "">("");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addStatus, setAddStatus] = useState<BookStatus>("READING");

  const loadBooks = async (status?: string) => {
    setLoading(true);
    const q = status ? `?status=${status}` : "";
    const res = await request(`/api/books${q}&limit=50`);
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

  const addBook = async (b: any) => {
    await request("/api/books", {
      method: "POST",
      body: JSON.stringify({
        title: b.title,
        author: b.author,
        totalPages: b.totalPages ?? 200,
        coverUrl: b.coverUrl,
        isbn: b.isbn,
        genre: b.genre,
        googleBooksId: b.googleBooksId,
        status: addStatus,
      }),
    });
    setShowAdd(false);
    setSearch("");
    setSearchResults([]);
    loadBooks(filter);
  };

  return (
    <div>
      <header className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-sm border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-xl">Biblioteca</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center"
        >
          <Plus size={18} className="text-white" />
        </button>
      </header>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {(["", "READING", "COMPLETED", "PAUSED", "WISHLIST"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === s ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            {s === "" ? "Todos" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-4 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-neutral-900 rounded-2xl h-52 animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 px-4">
          <BookOpen size={48} className="text-neutral-700 mx-auto mb-4" />
          <h2 className="font-semibold text-neutral-300 mb-2">Biblioteca vazia</h2>
          <p className="text-sm text-neutral-500 mb-6">Adicione seu primeiro livro</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
          >
            Adicionar livro
          </button>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-4">
          {books.map((b) => (
            <Link key={b.id} href={`/library/${b.id}`} className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-colors">
              <div className="aspect-[2/3] relative bg-neutral-800">
                {b.coverUrl ? (
                  <Image src={b.coverUrl} alt={b.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={32} className="text-neutral-700" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-neutral-900/90 rounded-lg px-2 py-1">
                  <p className="text-xs font-bold text-orange-400">{b.progressPercent ?? 0}%</p>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm leading-tight line-clamp-2">{b.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{b.author}</p>
                <p className={`text-xs font-medium mt-1 ${STATUS_COLORS[b.status as BookStatus]}`}>
                  {STATUS_LABELS[b.status as BookStatus]}
                </p>
                {b.status === "READING" && (
                  <div className="mt-2 bg-neutral-800 rounded-full h-1">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${b.progressPercent ?? 0}%` }} />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="bg-neutral-900 w-full max-w-lg mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-xl">Adicionar livro</h2>
              <button onClick={() => { setShowAdd(false); setSearch(""); setSearchResults([]); }} className="p-2 rounded-xl hover:bg-neutral-800">
                <X size={20} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); doSearch(e.target.value); }}
                placeholder="Buscar por título ou autor..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-neutral-600 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 mb-4">
              {(["READING", "WISHLIST", "COMPLETED"] as BookStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setAddStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    addStatus === s ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {searching && <p className="text-center text-sm text-neutral-500 py-4">Buscando...</p>}

            <div className="flex flex-col gap-3">
              {searchResults.map((b) => (
                <button
                  key={b.googleBooksId}
                  onClick={() => addBook(b)}
                  className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors text-left"
                >
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-neutral-700 flex-shrink-0">
                    {b.coverUrl ? (
                      <Image src={b.coverUrl} alt={b.title} width={40} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={14} className="text-neutral-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-2">{b.title}</p>
                    <p className="text-xs text-neutral-500">{b.author}</p>
                    {b.totalPages && <p className="text-xs text-neutral-600">{b.totalPages} páginas</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

