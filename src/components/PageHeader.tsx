export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </header>
  );
}
