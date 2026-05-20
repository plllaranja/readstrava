"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { formatDuration, formatPages } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, BookOpen, Clock, TrendingUp } from "lucide-react";

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
    if (pages === 0) return "bg-neutral-800";
    const p = pages / max;
    if (p < 0.25) return "bg-emerald-900";
    if (p < 0.5) return "bg-emerald-700";
    if (p < 0.75) return "bg-emerald-500";
    return "bg-emerald-400";
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-rows-7 grid-flow-col gap-0.5 w-max">
        {cells.map((c) => (
          <div
            key={c.date}
            title={`${c.date}: ${c.pages} páginas`}
            className={`w-3 h-3 rounded-sm ${intensity(c.pages)}`}
          />
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
        {[1, 2, 3].map((i) => <div key={i} className="bg-neutral-900 rounded-2xl h-32 animate-pulse" />)}
      </div>
    );
  }

  const { stats, heatmap, paceTrend, achievements } = data ?? {};

  return (
    <div>
      <header className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-sm border-b border-neutral-800 px-4 py-3">
        <h1 className="font-bold text-xl">Estatísticas</h1>
      </header>

      <div className="p-4 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} className="text-orange-400" />
              <span className="text-sm text-neutral-400">Sequência atual</span>
            </div>
            <p className="text-4xl font-black">{stats?.streak ?? 0}</p>
            <p className="text-sm text-neutral-500">dias seguidos</p>
          </div>

          {[
            { label: "Esta semana", pages: stats?.week?.pages, time: stats?.week?.timeSeconds, icon: TrendingUp },
            { label: "Este mês", pages: stats?.month?.pages, time: stats?.month?.timeSeconds, icon: BookOpen },
          ].map(({ label, pages, time, icon: Icon }) => (
            <div key={label} className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={14} className="text-emerald-400" />
                <span className="text-xs text-neutral-400">{label}</span>
              </div>
              <p className="text-2xl font-bold">{formatPages(pages ?? 0)}</p>
              <p className="text-xs text-neutral-500">páginas</p>
              <p className="text-xs text-neutral-600 mt-1">{time ? formatDuration(time) : "—"}</p>
            </div>
          ))}

          <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={14} className="text-blue-400" />
              <span className="text-xs text-neutral-400">Este ano</span>
            </div>
            <p className="text-2xl font-bold">{stats?.year?.completedBooks ?? 0}</p>
            <p className="text-xs text-neutral-500">livros lidos</p>
            <p className="text-xs text-neutral-600 mt-1">{formatPages(stats?.year?.pages ?? 0)} págs</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
          <h2 className="font-semibold mb-4">Atividade — 365 dias</h2>
          <Heatmap data={heatmap ?? {}} />
          <div className="flex items-center gap-2 mt-3 text-xs text-neutral-600">
            <span>menos</span>
            {["bg-neutral-800", "bg-emerald-900", "bg-emerald-700", "bg-emerald-500", "bg-emerald-400"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>mais</span>
          </div>
        </div>

        {paceTrend?.length > 1 && (
          <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
            <h2 className="font-semibold mb-4">Pace médio (páginas/hora)</h2>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={paceTrend}>
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => v.slice(5)}
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: 8 }}
                  labelStyle={{ color: "#a3a3a3", fontSize: 11 }}
                  formatter={(v: any) => [`${v} pág/h`, "Pace"]}
                />
                <Line type="monotone" dataKey="avgPace" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {achievements?.length > 0 && (
          <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
            <h2 className="font-semibold mb-4">Conquistas ({achievements.length})</h2>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((a: any) => (
                <div key={a.id} className="flex flex-col items-center gap-1.5 p-3 bg-neutral-800 rounded-xl">
                  <span className="text-2xl">{a.meta?.icon ?? "⭐"}</span>
                  <p className="text-[10px] text-center font-medium leading-tight">{a.meta?.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
