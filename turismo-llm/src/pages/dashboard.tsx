import React, { useState } from 'react';
import { 
  MessageSquare, AlertTriangle, XCircle, MoreVertical, 
  MapPin, Shield, Home, CheckCircle2, Trash2 
} from 'lucide-react';
// Certifique-se de ajustar o caminho da importação do Header caso esteja em outra pasta
import Header from '../components/Header'; 

interface Alerta {
  id: number;
  localidade: string;
  problema: string;
  severidade: 'Alto' | 'Médio' | 'Baixo';
  horario: string;
  tipo: 'map' | 'shield' | 'home';
}

export default function Dashboard() {
  // 1. ESTADOS LOCALIZADOS NO DASHBOARD
  const [searchTerm, setSearchTerm] = useState('');
  const [periodo, setPeriodo] = useState('Esta Semana');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  
  const [alertas, setAlertas] = useState<Alerta[]>([
    { id: 1, localidade: 'Praia do Sol - Norte', problema: 'Acúmulo de resíduos sólidos em área protegida', severidade: 'Alto', horario: 'Há 14 min', tipo: 'map' },
    { id: 2, localidade: 'Trilha do Mirante', problema: 'Sinalização de segurança vandalizada', severidade: 'Médio', horario: 'Há 45 min', tipo: 'shield' },
    { id: 3, localidade: 'Museu Histórico', problema: 'Obstrução em rampa de acessibilidade lateral', severidade: 'Baixo', horario: 'Há 1 hora', tipo: 'home' }
  ]);

  const dadosGrafico = periodo === 'Esta Semana' 
    ? { seguranca: { qtd: 68, h: 'h-44' }, higiene: { qtd: 42, h: 'h-28' }, acesso: { qtd: 32, h: 'h-20' } }
    : { seguranca: { qtd: 245, h: 'h-48' }, higiene: { qtd: 198, h: 'h-40' }, acesso: { qtd: 110, h: 'h-24' } };

  const handleDeletarAlerta = (id: number) => {
    setAlertas(alertas.filter(alerta => alerta.id !== id));
    setActiveMenuId(null);
  };

  const handleResolverAlerta = (id: number) => {
    alert(`Alerta #${id} marcado como resolvido!`);
    setAlertas(alertas.filter(alerta => alerta.id !== id));
    setActiveMenuId(null);
  };

  const alertasFiltrados = alertas.filter(alerta => 
    alerta.localidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alerta.problema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-[#1b1c1d]">
      
      {/* O HEADER AGORA FAZ PARTE EXCLUSIVA DESTA TELA */}
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <main className="max-w-[1400px] mx-auto p-6 flex flex-col gap-6">
        {/* 2. METRIC CARDS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#505f76] tracking-wider uppercase">Total de Comentários</p>
                <h3 className="text-[36px] font-bold text-[#041627] mt-2 tracking-tight">12.4k</h3>
              </div>
              <div className="p-2 text-[#74777d]">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-[#74777d]">
              <span className="text-[#128049] font-semibold flex items-center gap-0.5">↗ +12%</span>
              <span>Últimos 30 dias de processamento AI</span>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#505f76] tracking-wider uppercase">Infrações Ativas</p>
                <h3 className="text-[36px] font-bold text-[#ba1a1a] mt-2 tracking-tight">{alertas.length}</h3>
              </div>
              <div className="p-2 text-[#ba1a1a]">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-[#74777d]">
              <span className="text-[#ba1a1a] font-semibold flex items-center gap-0.5">↗ Atualizado</span>
              <span>Requerem atenção imediata</span>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#505f76] tracking-wider uppercase">Pontos Sob Risco</p>
                <h3 className="text-[36px] font-bold text-[#041627] mt-2 tracking-tight">8</h3>
              </div>
              <div className="p-2 text-[#74777d]">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-[#74777d]">
              <span className="text-[#505f76] font-semibold">→ Estável</span>
              <span>Localidades com nível crítico de risco</span>
            </div>
          </div>
        </div>

        {/* 3. MIDDLE GRAPHICS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[20px] font-semibold text-[#041627]">Infrações por Categoria</h4>
              <select 
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="border border-[#c4c6cd] rounded px-3 py-1 text-xs bg-white text-[#44474c] focus:outline-none focus:ring-1 focus:ring-[#041627]"
              >
                <option value="Esta Semana">Esta Semana</option>
                <option value="Este Mês">Este Mês</option>
              </select>
            </div>
            
            <div className="flex items-end justify-around h-64 pt-8 px-4 relative border-b border-[#E2E8F0]">
              <div className="flex flex-col items-center gap-3 w-16 group">
                <span className="text-xs font-semibold text-[#44474c] transition-transform group-hover:-translate-y-1">{dadosGrafico.seguranca.qtd}</span>
                <div className={`bg-[#041627] w-full ${dadosGrafico.seguranca.h} rounded-t-sm transition-all duration-500 ease-out`}></div>
                <span className="text-xs text-[#44474c] font-medium mt-1">Segurança</span>
              </div>
              <div className="flex flex-col items-center gap-3 w-16 group">
                <span className="text-xs font-semibold text-[#44474c] transition-transform group-hover:-translate-y-1">{dadosGrafico.higiene.qtd}</span>
                <div className={`bg-[#505f76] w-full ${dadosGrafico.higiene.h} rounded-t-sm transition-all duration-500 ease-out`}></div>
                <span className="text-xs text-[#44474c] font-medium mt-1">Higiene</span>
              </div>
              <div className="flex flex-col items-center gap-3 w-16 group">
                <span className="text-xs font-semibold text-[#44474c] transition-transform group-hover:-translate-y-1">{dadosGrafico.acesso.qtd}</span>
                <div className={`bg-[#d0e1fb] w-full ${dadosGrafico.acesso.h} rounded-t-sm transition-all duration-500 ease-out`}></div>
                <span className="text-xs text-[#44474c] font-medium mt-1">Acesso</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col gap-6 shadow-sm">
            <div>
              <h4 className="text-[20px] font-semibold text-[#041627] mb-4">Pontos Críticos</h4>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Praia do Sol</span>
                    <span className="text-[#ba1a1a]">92% Risco</span>
                  </div>
                  <div className="w-full bg-[#efedef] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#ba1a1a] h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Parque Central</span>
                    <span className="text-[#a88c69]">74% Risco</span>
                  </div>
                  <div className="w-full bg-[#efedef] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#a88c69] h-full rounded-full" style={{ width: '74%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Mirante das Pedras</span>
                    <span className="text-[#505f76]">48% Risco</span>
                  </div>
                  <div className="w-full bg-[#efedef] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#505f76] h-full rounded-full" style={{ width: '48%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div onClick={() => alert('Abrindo modal de Geolocalização...')} className="relative rounded-lg overflow-hidden h-32 mt-auto group cursor-pointer shadow-sm">
              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80" alt="Heatmap" className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <button className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded text-xs font-bold text-[#041627] shadow-sm hover:bg-white transition-colors">Ver Mapa de Calor</button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. RECENT ALERTS TABLE SECTION */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
            <h4 className="text-[20px] font-semibold text-[#041627]">Alertas Recentes</h4>
            <span className="text-xs text-[#74777d]">Exibindo {alertasFiltrados.length} de {alertas.length} resultados</span>
          </div>

          <div className="overflow-x-auto">
            {alertasFiltrados.length === 0 ? (
              <div className="p-12 text-center text-[#74777d]">Nenhum alerta encontrado.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[#505f76] text-xs font-bold tracking-wider uppercase border-b border-[#E2E8F0]">
                    <th className="py-3 px-6">Localidade</th>
                    <th className="py-3 px-6">Problema Detectado</th>
                    <th className="py-3 px-6 text-center">Severidade</th>
                    <th className="py-3 px-6">Horário</th>
                    <th className="py-3 px-6 text-center relative">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-sm text-[#1b1c1d]">
                  {alertasFiltrados.map((alerta) => (
                    <tr key={alerta.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-6 font-semibold flex items-center gap-3">
                        <div className="p-1.5 bg-[#efedef] text-[#041627] rounded">
                          {alerta.tipo === 'map' && <MapPin className="w-4 h-4" />}
                          {alerta.tipo === 'shield' && <Shield className="w-4 h-4" />}
                          {alerta.tipo === 'home' && <Home className="w-4 h-4" />}
                        </div>
                        {alerta.localidade}
                      </td>
                      <td className="py-4 px-6 text-[#44474c]">{alerta.problema}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase ${
                          alerta.severidade === 'Alto' ? 'bg-[#ffdad6] text-[#93000a]' :
                          alerta.severidade === 'Médio' ? 'bg-[#d0e1fb] text-[#38485d]' : 'bg-[#efedef] text-[#44474c]'
                        }`}>{alerta.severidade}</span>
                      </td>
                      <td className="py-4 px-6 text-[#44474c]">{alerta.horario}</td>
                      <td className="py-4 px-6 text-center relative">
                        <button onClick={() => setActiveMenuId(activeMenuId === alerta.id ? null : alerta.id)} className="hover:text-[#041627] p-1 rounded-full hover:bg-slate-100"><MoreVertical className="w-4 h-4 mx-auto" /></button>
                        {activeMenuId === alerta.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)}></div>
                            <div className="absolute right-12 top-2 mt-2 w-44 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1 z-20 text-left">
                              <button onClick={() => handleResolverAlerta(alerta.id)} className="w-full px-4 py-2 text-xs text-emerald-700 hover:bg-emerald-50 font-medium flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Resolver</button>
                              <button onClick={() => handleDeletarAlerta(alerta.id)} className="w-full px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 font-medium flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}