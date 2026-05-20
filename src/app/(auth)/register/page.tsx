"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen } from "lucide-react";

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
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">ReadStrava</span>
        </div>
        <p className="text-neutral-400 text-sm">Crie sua conta e comece a rastrear</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
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
            <label className="text-sm font-medium text-neutral-300">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={set(key as keyof typeof form)}
              required
              minLength={key === "password" ? 8 : 1}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder={placeholder}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-colors mt-2"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
          Entrar
        </Link>
      </p>
    </div>
  );
}
