import { useEffect, useState, useCallback } from 'react';
import { 
  AlertTriangle, MoreVertical, 
  MapPin, Shield, Home, CheckCircle2, Trash2, Clock, 
  RefreshCw, Radio, Sliders, Maximize,  
  BarChart2, Check, Hourglass, Users, Flame, 
  ArrowRight, ClipboardList, Filter, Accessibility, Loader2
} from 'lucide-react';

// Imports do Material-UI para o botão do satélite
import Button from '@mui/material/Button';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import { useAuth } from '../contexts/AuthContext';
import type { Alerta } from '../models/Visual';
import TotalCommentaries from '../components/totalComentaries';
import Infractions from '../components/Infractions';
import type { TouristSpot } from '../models/Spot';
import DashboardSpotsMap from '../components/DashboardMap';

// Importações do Firebase para escutar em tempo real
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function Dashboard() {
  const auth = useAuth();
  const currentUser = auth.currentUser;

  // 1. ESTADOS LOCALIZADOS NO DASHBOARD
  const [searchTerm] = useState('');
  const [periodo, setPeriodo] = useState('Esta Semana');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  
  // Novos estados para o fluxo assíncrono com o Python e Firebase
  const [analysisStatus, setAnalysisStatus] = useState<string>('idle');
  const [dbAlertas, setDbAlertas] = useState<any[]>([]);

  // Função centralizada para disparar a análise no Proxy (Backend Python)
  const triggerBackendAnalysis = useCallback(async (forceRefresh = false) => {
    const city = currentUser?.cityChoiceForAnalysis;
    if (!city || !city.placeId) return;

    try {
      const spotIds = spots.map(s => s.id).filter(Boolean);

      const response = await fetch('http://localhost:8000/api/analyze-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: city.placeId,
          city_name: city.name,
          spot_ids: spotIds,
          force_refresh: forceRefresh
        })
      });
      const data = await response.json();
      console.log("Status do Proxy:", data);
    } catch (error) {
      console.error("Erro ao disparar análise no backend:", error);
    }
  }, [currentUser, spots]);

  // Efeito para carregar dados do Firebase e escutar mudanças em tempo real
  useEffect(() => {
    const city = currentUser?.cityChoiceForAnalysis;
    if (!city || !city.placeId) return;

    // 1. Chama o proxy automaticamente se já tivermos spots na tela
    if (spots.length > 0) {
      triggerBackendAnalysis(false);
    }

    // 2. Ouvinte em tempo real (onSnapshot) do status da cidade (Deep Analysis)
    const statusRef = doc(db, 'deep_analysis_status', city.placeId);
    const unsubscribeStatus = onSnapshot(statusRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAnalysisStatus(data.analysis_status || 'idle'); // 'processing', 'idle', 'error'
      }
    });

    // 3. Ouvinte em tempo real dos Alertas gerados pela IA
    const alertsRef = collection(db, 'alerts');
    const unsubscribeAlerts = onSnapshot(alertsRef, (snapshot) => {
      const alertsList: any[] = [];
      snapshot.forEach((docSnap) => {
        const alertData = docSnap.data();
        if (alertData.place_id === city.placeId) {
          alertsList.push({ 
            id: docSnap.id, 
            localidade: alertData.spot_name || city.name,
            problema: alertData.justificativa || alertData.tipo_perigo,
            severidade: alertData.tipo_perigo === 'CRIME_GRAVE' ? 'Alto' : 'Médio',
            horario: 'Recente',
            tipo: 'map',
            ...alertData 
          });
        }
      });
      if (alertsList.length > 0) {
        setDbAlertas(alertsList);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeAlerts();
    };
  }, [currentUser, spots, triggerBackendAnalysis]);

  // Usa os alertas do banco se houverem, senão mantém um array vazio
  const alertasAtivos = dbAlertas.length > 0 ? dbAlertas : [];

  const handleDeletarAlerta = (id: any) => {
    setDbAlertas(dbAlertas.filter(alerta => alerta.id !== id));
    setActiveMenuId(null);
  };

  const handleResolverAlerta = (id: any) => {
    alert(`Alerta #${id} marcado como resolvido!`);
    setDbAlertas(dbAlertas.filter(alerta => alerta.id !== id));
    setActiveMenuId(null);
  };

  const alertasFiltrados = alertasAtivos.filter(alerta => 
    (alerta.localidade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alerta.problema || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dadosGrafico = periodo === 'Esta Semana' 
    ? { seguranca: { qtd: 68, p: '47.8%' }, higiene: { qtd: 42, p: '29.5%' }, acesso: { qtd: 32, p: '22.7%' } }
    : { seguranca: { qtd: 245, p: '52.1%' }, higiene: { qtd: 198, p: '31.2%' }, acesso: { qtd: 110, p: '16.7%' } };

  return (
    <div className="bg-[#F8FAFC] text-[#1b1c1d] min-h-screen flex flex-col antialiased selection:bg-[#041627] selection:text-white font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0.15; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .radar-pulse-high { animation: pulse-ring 2.5s cubic-bezier(0.24, 0, 0.38, 1) infinite; }
        .radar-pulse-medium { animation: pulse-ring 3.2s cubic-bezier(0.24, 0, 0.38, 1) infinite 0.5s; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #F1F5F9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 9999px; }
      `}} />

      <main className="flex-grow max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10 sm:space-y-14 pb-12">
        
        {/* BANNER DE PROCESSAMENTO DA IA */}
        {analysisStatus === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-5 py-3 rounded-xl flex items-center justify-between gap-3 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide">Varredura Profunda em Andamento</p>
                <p className="text-xs text-blue-700 mt-0.5">A Inteligência Artificial e o Apify estão analisando os comentários desta região em segundo plano...</p>
              </div>
            </div>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">Processando</span>
          </div>
        )}

        {/* SECTION: INTRO & OVERVIEW KPI METRICS */}
        <section className="space-y-6 scroll-mt-24" id="metricas">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#505f76] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#041627]"></span>
                Painel Central de Controle
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#041627] tracking-tight">Monitoramento em Tempo Real</h2>
              <p className="text-sm text-[#505f76] mt-1 max-w-2xl">
                Acompanhe indicadores territoriais agregados, fluxo de notificações da população e integridade dos sensores.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="flex items-center text-xs text-[#505f76] bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg shadow-sm font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5" /> Última sincronização: <strong className="text-[#041627] ml-1">Hoje, 14:38</strong>
              </span>
              <button onClick={() => triggerBackendAnalysis(true)} className="p-2 bg-white border border-[#E2E8F0] rounded-lg text-slate-600 hover:text-[#041627] hover:bg-slate-50 transition-colors shadow-sm" title="Atualizar dados">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <TotalCommentaries />
            
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Infrações Ativas</p>
                  <Infractions />
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-50 text-[#ba1a1a] flex items-center justify-center transition-transform group-hover:scale-105">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-[#ba1a1a]">
                  <Flame className="w-3 h-3" /> Atenção Imediata
                </span>
                <span className="text-[#74777d]">{alertasAtivos.length} críticas</span>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Pontos Sob Risco</p>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-[#041627] mt-2 tracking-tight">8</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center transition-transform group-hover:scale-105">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-[#505f76] font-semibold">
                  <RefreshCw className="w-3.5 h-3.5" /> Índice Estável
                </div>
                <span className="text-[#74777d]">Em 3 distritos</span>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Zonas Monitoradas</p>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-[#041627] mt-2 tracking-tight">12</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition-transform group-hover:scale-105">
                  <Radio className="w-6 h-6" />
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 100% Online
                </div>
                <span className="text-[#74777d]">28 sensores ativos</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: DEDICATED LARGE MAP SECTION */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-8 shadow-sm space-y-6 scroll-mt-24" id="mapa">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#041627] tracking-tight">Monitoramento Espacial</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#505f76] mt-1">Visualização cartográfica em tempo real dos focos prioritários.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex rounded-lg shadow-sm border border-[#E2E8F0] p-1 bg-[#F8FAFC]">
                <button className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#041627] text-white">Todos</button>
                <button className="px-3 py-1.5 rounded-md text-xs font-medium text-[#505f76] hover:text-[#041627] transition-colors">Alto Risco</button>
                <button className="px-3 py-1.5 rounded-md text-xs font-medium text-[#505f76] hover:text-[#041627] transition-colors">Médio</button>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9] text-[#44474c] text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" /> Camadas
                </button>
                <button className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9] text-[#44474c] text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Maximize className="w-3.5 h-3.5 text-slate-500" /> Tela Cheia
                </button>
              </div>
            </div>
          </div>

          <div className="relative w-full h-[500px] sm:h-[560px] rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#F4F6F8] shadow-inner select-none">
            <DashboardSpotsMap
              spots={spots} 
              onSpotClick={() => {}} 
              height='100%'
              setSpots={setSpots}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-4 w-full bg-white rounded-xl">
            <div className="flex items-center gap-3 text-xs text-[#505f76]">
              <span className="text-[11px] text-[#74777d]">
                Região ativa: <strong>{currentUser?.cityChoiceForAnalysis?.name || 'Nenhuma cidade selecionada'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
              <Button
                variant="contained"
                disableElevation
                onClick={() => triggerBackendAnalysis(true)}
                disabled={analysisStatus === 'processing'}
                startIcon={<SatelliteAltIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: '0.5rem',
                  padding: '6px 16px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#041627',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                  '&:disabled': {
                    backgroundColor: '#94a3b8',
                    color: '#f1f5f9'
                  }
                }}
              >
                {analysisStatus === 'processing' ? 'Varrendo com IA...' : `Varrer ${ currentUser?.cityChoiceForAnalysis?.name || '' }`}
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION: ANALYTICS & CRITICAL ZONES */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 scroll-mt-24" id="analitico">
          <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#505f76] mb-0.5">
                  <BarChart2 className="w-3.5 h-3.5 text-slate-500" /> Distribuição Temática
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-[#041627]">Infrações por Categoria</h4>
                <p className="text-xs text-[#74777d] mt-0.5">Volume de ocorrências validadas por fiscalização</p>
              </div>
              <select 
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="border border-[#CBD5E1] rounded-lg px-3.5 py-1.5 text-xs font-medium bg-white text-[#44474c] focus:outline-none focus:ring-2 focus:ring-[#041627] cursor-pointer"
              >
                <option>Esta Semana</option>
                <option>Este Mês</option>
              </select>
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

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[#F1F5F9] pb-3">
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-[#041627]">Zonas Mais Críticas</h4>
                  <p className="text-xs text-[#74777d]">Índice de vulnerabilidade territorial</p>
                </div>
                <span className="text-[11px] bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded-full">Top 3</span>
              </div>
              <div className="space-y-5">
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <div className="flex justify-between items-center text-xs font-semibold mb-2">
                    <span className="flex items-center gap-1.5 text-[#041627] font-bold"><MapPin className="w-3.5 h-3.5 text-[#ba1a1a]" /> Praia do Sol</span>
                    <span className="text-[#ba1a1a] font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">92% Risco</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#ba1a1a] h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <div className="flex justify-between items-center text-xs font-semibold mb-2">
                    <span className="flex items-center gap-1.5 text-[#041627] font-bold"><MapPin className="w-3.5 h-3.5 text-[#d97706]" /> Trilha do Mirante</span>
                    <span className="text-[#d97706] font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">74% Risco</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#d97706] h-full rounded-full" style={{ width: '74%' }}></div>
                  </div>
                </div>
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <div className="flex justify-between items-center text-xs font-semibold mb-2">
                    <span className="flex items-center gap-1.5 text-[#041627] font-bold"><MapPin className="w-3.5 h-3.5 text-[#505f76]" /> Museu Histórico</span>
                    <span className="text-[#505f76] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">48% Risco</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#505f76] h-full rounded-full" style={{ width: '48%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative rounded-xl overflow-hidden p-5 group cursor-pointer shadow-md border border-[#041627] bg-gradient-to-br from-[#041627] via-[#0a2540] to-[#1e3a8a] text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest uppercase text-blue-200 flex items-center gap-1.5"><Flame className="w-3 h-3 text-amber-400" /> Visão Espacial</span>
                  <h5 className="text-sm font-bold mt-1">Camada de Calor (Heatmap)</h5>
                </div>
                <button className="bg-white px-3.5 py-2 rounded-lg text-xs font-bold text-[#041627] shadow hover:bg-slate-100 transition-all flex items-center gap-1.5 whitespace-nowrap">
                  Ativar <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: OPERATIONAL FEED & ALERTS */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm space-y-0 scroll-mt-24" id="ocorrencias">
          <div className="p-6 sm:p-8 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#505f76] mb-0.5">
                <ClipboardList className="w-4 h-4 text-slate-500" /> Registro de Operações
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-[#041627]">Gestão de Ocorrências & Alertas Recentes</h4>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <select className="pl-8 pr-4 py-1.5 text-xs border border-[#CBD5E1] rounded-lg bg-white text-[#44474c] focus:outline-none">
                  <option>Todos os Status</option>
                  <option>Crítico / Alto</option>
                </select>
              </div>
              <span className="text-xs font-medium text-[#74777d] bg-[#F1F5F9] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                Exibindo <strong>{alertasFiltrados.length}</strong> de <strong>{alertasAtivos.length}</strong> alertas ativos
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {alertasFiltrados.length === 0 ? (
              <div className="p-12 text-center text-[#74777d]">Nenhum alerta encontrado na base de dados para esta região.</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#F8FAFC] text-[#505f76] text-xs font-bold tracking-wider uppercase border-b border-[#E2E8F0]">
                    <th className="py-3.5 px-6">Localidade</th>
                    <th className="py-3.5 px-6">Problema Detectado</th>
                    <th className="py-3.5 px-6 text-center">Severidade</th>
                    <th className="py-3.5 px-6">Horário</th>
                    <th className="py-3.5 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-sm text-[#1b1c1d]">
                  {alertasFiltrados.map((alerta) => (
                    <tr key={alerta.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      <td className="py-4 px-6 font-semibold flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          alerta.severidade === 'Alto' ? 'bg-red-50 text-[#ba1a1a]' : 'bg-amber-50 text-[#d97706]'
                        }`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-[#041627]">{alerta.localidade}</span>
                      </td>
                      <td className="py-4 px-6 text-[#1b1c1d] font-medium">{alerta.problema}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full uppercase inline-flex items-center gap-1 ${
                          alerta.severidade === 'Alto' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#fef3c7] text-[#92400e]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${alerta.severidade === 'Alto' ? 'bg-[#ba1a1a]' : 'bg-[#d97706]'}`}></span>
                          {alerta.severidade}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-[#505f76] font-medium">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-slate-400"/> {alerta.horario}</span>
                      </td>
                      <td className="py-4 px-6 text-center relative">
                        <button onClick={() => setActiveMenuId(activeMenuId === alerta.id ? null : alerta.id)} className="p-1 rounded hover:bg-slate-200">
                          <MoreVertical className="w-4 h-4" />
                        </button>
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
        </section>
      </main>
    </div>
  );
}