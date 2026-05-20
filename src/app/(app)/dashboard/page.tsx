"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { formatDuration, formatPages } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, BookOpen, TrendingUp } from "lucide-react";

function Heatmap({ data }: { data: Record<string, number> }) {
  const cells: { date: string; pages: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    cells.push({ date: key, pages: data[key] ?? 0 });
  }
  const max = Math.max(...cells.map((c) => c.pages), 1);
  const intensity = (pages: number) => {
    if (pages === 0) return "bg-gray-100";
    const p = pages / max;
    if (p < 0.25) return "bg-orange-200";
    if (p < 0.5) return "bg-orange-300";
    if (p < 0.75) return "bg-orange-400";
    return "bg-[#FC5200]";
  };
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-rows-7 grid-flow-col gap-0.5 w-max">
        {cells.map((c) => (
          <div key={c.date} title={`${c.date}: ${c.pages} páginas`} className={`w-3 h-3 rounded-sm ${intensity(c.pages)}`} />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { request } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/api/dashboard").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="bg-white border border-gray-200 rounded h-32 animate-pulse" />)}
      </div>
    );
  }

  const { stats, heatmap, paceTrend, achievements } = data ?? {};

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="font-bold text-xl text-[#353633]">Estatísticas</h1>
      </header>

      <div className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FC5200] rounded p-4 col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} className="text-white opacity-80" />
              <span className="text-sm text-white opacity-80 font-semibold">Sequência atual</span>
            </div>
            <p className="text-5xl font-black text-white">{stats?.streak ?? 0}</p>
            <p className="text-sm text-white opacity-70">dias seguidos</p>
          </div>

          {[
            { label: "Esta semana", pages: stats?.week?.pages, time: stats?.week?.timeSeconds },
            { label: "Este mês", pages: stats?.month?.pages, time: stats?.month?.timeSeconds },
          ].map(({ label, pages, time }) => (
            <div key={label} className="bg-white border border-gray-200 rounded p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">{label}</p>
              <p className="text-2xl font-black text-[#353633]">{formatPages(pages ?? 0)}</p>
              <p className="text-xs text-gray-400">páginas</p>
              <p className="text-xs text-gray-300 mt-1">{time ? formatDuration(time) : "—"}</p>
            </div>
          ))}

          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Este ano</p>
            <p className="text-2xl font-black text-[#353633]">{stats?.year?.completedBooks ?? 0}</p>
            <p className="text-xs text-gray-400">livros lidos</p>
            <p className="text-xs text-gray-300 mt-1">{formatPages(stats?.year?.pages ?? 0)} págs</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="font-bold text-[#353633] mb-4">Atividade — 365 dias</h2>
          <Heatmap data={heatmap ?? {}} />
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span>menos</span>
            {["bg-gray-100", "bg-orange-200", "bg-orange-300", "bg-orange-400", "bg-[#FC5200]"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>mais</span>
          </div>
        </div>

        {paceTrend?.length > 1 && (
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="font-bold text-[#353633] mb-4">Pace médio (páginas/hora)</h2>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={paceTrend}>
                <XAxis dataKey="month" tickFormatter={(v) => v.slice(5)} tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4 }}
                  labelStyle={{ color: "#353633", fontSize: 11 }}
                  formatter={(v: any) => [`${v} pág/h`, "Pace"]}
                />
                <Line type="monotone" dataKey="avgPace" stroke="#FC5200" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {achievements?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="font-bold text-[#353633] mb-4">Conquistas ({achievements.length})</h2>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((a: any) => (
                <div key={a.id} className="flex flex-col items-center gap-1.5 p-3 bg-[#F7F7FA] border border-gray-200 rounded">
                  <span className="text-2xl">{a.meta?.icon ?? "⭐"}</span>
                  <p className="text-[10px] text-center font-semibold text-[#353633] leading-tight">{a.meta?.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
