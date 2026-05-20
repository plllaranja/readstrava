"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, PlusCircle, BarChart2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/library", icon: BookOpen, label: "Biblioteca" },
  { href: "/record", icon: PlusCircle, label: "Registrar" },
  { href: "/dashboard", icon: BarChart2, label: "Stats" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const isRecord = href === "/record";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-all",
                isRecord
                  ? "bg-[#FC5200] text-white p-2 rounded-sm scale-110 shadow-lg"
                  : active
                  ? "text-[#FC5200]"
                  : "text-gray-400 hover:text-[#353633]"
              )}
            >
              <Icon size={isRecord ? 22 : 20} strokeWidth={active || isRecord ? 2.5 : 1.8} />
              {!isRecord && (
                <span className="text-[10px] font-medium leading-none">{label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
