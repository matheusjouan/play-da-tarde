import Link from "next/link";
import { CalendarDays, ChevronRight, FileText, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const ITENS = [
  { href: "/admin/jogadores", label: "Jogadores", desc: "Cadastro de todos os jogadores", icon: Users },
  { href: "/admin/etapas", label: "Etapas", desc: "Criar etapas e tabelas de pontos", icon: CalendarDays },
  { href: "/admin/regulamentos", label: "Regulamentos", desc: "Links dos regulamentos por etapa", icon: FileText },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Administração" />
      <ul className="space-y-2">
        {ITENS.map(({ href, label, desc, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 hover:bg-slate-50"
            >
              <Icon className="text-emerald-700" size={24} />
              <span className="flex-1">
                <span className="block font-medium">{label}</span>
                <span className="block text-sm text-slate-500">{desc}</span>
              </span>
              <ChevronRight className="text-slate-400" size={20} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
