import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query muito curta" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20${apiKey ? `&key=${apiKey}` : ""}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return NextResponse.json({ error: "Erro ao buscar livros" }, { status: 502 });
  }

  const data = await res.json();
  const books = (data.items ?? []).map((item: any) => ({
    googleBooksId: item.id,
    title: item.volumeInfo?.title ?? "Sem título",
    author: item.volumeInfo?.authors?.[0] ?? "Autor desconhecido",
    publisher: item.volumeInfo?.publisher ?? null,
    totalPages: item.volumeInfo?.pageCount ?? null,
    coverUrl: item.volumeInfo?.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
    isbn: item.volumeInfo?.industryIdentifiers?.find((i: any) => i.type === "ISBN_13")?.identifier ?? null,
    genre: item.volumeInfo?.categories?.[0] ?? null,
    description: item.volumeInfo?.description ?? null,
  }));

  return NextResponse.json({ books });
}
