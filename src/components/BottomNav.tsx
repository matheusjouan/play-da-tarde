"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, History, ListOrdered, Medal, Network, Users } from "lucide-react";

const TABS = [
  { href: "/recentes", label: "Recentes", icon: History },
  { href: "/grupos", label: "Grupos", icon: Users },
  { href: "/geral", label: "Geral", icon: ListOrdered },
  { href: "/chaves", label: "Chaves", icon: Network },
  { href: "/rank", label: "Rank", icon: Medal },
  { href: "/regulamentos", label: "Regras", icon: FileText },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-superficie pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-3xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  active ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
