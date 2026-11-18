import { Shield, Trash2, BarChart2, Check, Hourglass, Users, Accessibility } from 'lucide-react';

export default function InfractionsByCategory() {
  const dadosGrafico = {
    seguranca: { qtd: 68, p: '47.8%' },
    higiene: { qtd: 42, p: '29.5%' },
    acesso: { qtd: 32, p: '22.7%' },
  };

  return (
    <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#505f76] mb-0.5">
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" /> Distribuição Temática
          </div>
          <h4 className="text-xl sm:text-2xl font-bold text-[#041627]">Infrações por Categoria</h4>
          <p className="text-xs text-[#74777d] mt-0.5">Volume de ocorrências validadas por fiscalização</p>
        </div>
      </div>

      <div className="pt-4 pb-2">
        <div className="flex items-end justify-around h-64 sm:h-72 px-4 sm:px-12 relative border-b border-[#E2E8F0]">
          {/* Segurança */}
          <div className="flex flex-col items-center gap-3 w-24 sm:w-28 group cursor-pointer h-full justify-end">
            <span className="text-xs font-bold text-[#041627] bg-slate-100 px-2 py-0.5 rounded group-hover:-translate-y-1 group-hover:bg-[#041627] group-hover:text-white transition-all">
              {dadosGrafico.seguranca.qtd} casos
            </span>
            <div className="w-full bg-[#041627] rounded-t-lg transition-all duration-300 group-hover:opacity-90 shadow-md" style={{ height: dadosGrafico.seguranca.p }}></div>
            <div className="text-center mt-1">
              <span className="text-xs text-[#041627] font-bold flex items-center justify-center gap-1"><Shield className="w-3 h-3"/> Segurança</span>
              <span className="text-[11px] text-[#505f76]">{dadosGrafico.seguranca.p} do total</span>
            </div>
          </div>
          {/* Higiene */}
          <div className="flex flex-col items-center gap-3 w-24 sm:w-28 group cursor-pointer h-full justify-end">
            <span className="text-xs font-bold text-[#041627] bg-slate-100 px-2 py-0.5 rounded group-hover:-translate-y-1 group-hover:bg-[#505f76] group-hover:text-white transition-all">
              {dadosGrafico.higiene.qtd} casos
            </span>
            <div className="w-full bg-[#505f76] rounded-t-lg transition-all duration-300 group-hover:opacity-90 shadow-md" style={{ height: dadosGrafico.higiene.p }}></div>
            <div className="text-center mt-1">
              <span className="text-xs text-[#041627] font-bold flex items-center justify-center gap-1"><Trash2 className="w-3 h-3 text-[#505f76]"/> Higiene</span>
              <span className="text-[11px] text-[#505f76]">{dadosGrafico.higiene.p} do total</span>
            </div>
          </div>
          {/* Acesso */}
          <div className="flex flex-col items-center gap-3 w-24 sm:w-28 group cursor-pointer h-full justify-end">
            <span className="text-xs font-bold text-[#041627] bg-slate-100 px-2 py-0.5 rounded group-hover:-translate-y-1 group-hover:bg-blue-600 group-hover:text-white transition-all">
              {dadosGrafico.acesso.qtd} casos
            </span>
            <div className="w-full bg-[#93c5fd] hover:bg-blue-500 rounded-t-lg transition-all duration-300 shadow-md" style={{ height: dadosGrafico.acesso.p }}></div>
            <div className="text-center mt-1">
              <span className="text-xs text-[#041627] font-bold flex items-center justify-center gap-1"><Accessibility className="w-3 h-3 text-blue-600"/> Acesso</span>
              <span className="text-[11px] text-[#505f76]">{dadosGrafico.acesso.p} do total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#F1F5F9]">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-[#041627] text-xs"><Check className="w-4 h-4"/></div>
          <div><p className="text-[11px] text-[#505f76]">Resolvidos nesta semana</p><p className="text-sm font-bold text-[#041627]">118 casos (83%)</p></div>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs"><Hourglass className="w-4 h-4"/></div>
          <div><p className="text-[11px] text-[#505f76]">Tempo médio resposta</p><p className="text-sm font-bold text-[#041627]">38 minutos</p></div>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs"><Users className="w-4 h-4"/></div>
          <div><p className="text-[11px] text-[#505f76]">Agentes em ronda</p><p className="text-sm font-bold text-[#041627]">16 equipes</p></div>
        </div>
      </div>
    </div>
  );
}
