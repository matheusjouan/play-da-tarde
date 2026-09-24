import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function Voltar({ href = "/admin", label = "Administração" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="mb-2 -ml-2 inline-flex min-h-11 items-center gap-1 px-2 text-sm text-slate-500">
      <ChevronLeft size={18} /> {label}
    </Link>
  );
}
