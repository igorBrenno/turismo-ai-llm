import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

// Moldura padrão de cada gráfico da página de Gráficos
export default function ChartCard({ title, description, children, className = '' }: ChartCardProps) {
  return (
    <section className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4 ${className}`}>
      <header className="border-b border-[#F1F5F9] pb-3">
        <h3 className="text-base sm:text-lg font-bold text-[#041627]">{title}</h3>
        {description && <p className="text-xs text-[#74777d] mt-0.5">{description}</p>}
      </header>
      <div className="flex-grow min-h-[240px]">
        {children ?? <ChartPlaceholder />}
      </div>
    </section>
  );
}

function ChartPlaceholder() {
  return (
    <div className="h-full min-h-[240px] border border-dashed border-[#c4c6cd] rounded-xl flex items-center justify-center text-sm text-[#74777d]">
      Gráfico em construção
    </div>
  );
}
