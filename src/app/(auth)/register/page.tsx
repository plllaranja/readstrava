"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      router.replace("/feed");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

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
        <p className="text-gray-500 text-sm">Crie sua conta e comece a rastrear</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-4 py-3">
            {error}
          </div>
        )}

        {[
          { key: "name", label: "Nome completo", type: "text", placeholder: "João Silva" },
          { key: "username", label: "Username", type: "text", placeholder: "joaosilva" },
          { key: "email", label: "Email", type: "email", placeholder: "seu@email.com" },
          { key: "password", label: "Senha", type: "password", placeholder: "Mínimo 8 caracteres" },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#353633]">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={set(key as keyof typeof form)}
              required
              minLength={key === "password" ? 8 : 1}
              className="bg-white border border-gray-300 rounded px-4 py-3 text-[#353633] placeholder-gray-400 focus:outline-none focus:border-[#FC5200] transition-colors"
              placeholder={placeholder}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#FC5200] hover:bg-[#e04900] disabled:opacity-50 text-white font-bold rounded px-4 py-3.5 transition-colors mt-2 uppercase tracking-wide text-sm"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-[#FC5200] hover:underline font-semibold">
          Entrar
        </Link>
      </p>
    </div>
  );
}
