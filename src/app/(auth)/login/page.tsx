"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/feed");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" fill="#FC5200" />
            <path d="M18 8l-4 8h3l-5 10 10-12h-4z" fill="white" />
          </svg>
          <span className="text-2xl font-bold tracking-tight text-[#353633]">ReadStrava</span>
        </div>
        <p className="text-gray-500 text-sm">Rastreie sua leitura como um atleta</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#353633]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white border border-gray-300 rounded px-4 py-3 text-[#353633] placeholder-gray-400 focus:outline-none focus:border-[#FC5200] transition-colors"
            placeholder="seu@email.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#353633]">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white border border-gray-300 rounded px-4 py-3 text-[#353633] placeholder-gray-400 focus:outline-none focus:border-[#FC5200] transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#FC5200] hover:bg-[#e04900] disabled:opacity-50 text-white font-bold rounded px-4 py-3.5 transition-colors mt-2 uppercase tracking-wide text-sm"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Não tem conta?{" "}
        <Link href="/register" className="text-[#FC5200] hover:underline font-semibold">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
