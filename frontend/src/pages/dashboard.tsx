import { useEffect, useState, useCallback } from 'react';
import {
  MapPin, Shield, CheckCircle2,
  Radio,
  ClipboardList, Filter, Loader2, ChevronDown
} from 'lucide-react';

import Button from '@mui/material/Button';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import { useAuth } from '../contexts/AuthContext';
import TotalCommentaries from '../components/totalComentaries';
import Infractions from '../components/Infractions';
import UnderRisk from '../components/UnderRisk';
import type { TouristSpot, TouristSpotDashboard } from '../models/Spot';
import DashboardSpotsMap from '../components/DashboardMap';
import CustomAlertsPanel from '../components/CustomAlertsPanel';
import InfractionsByCategory from '../components/InfractionsByCategory';
import { GooglePlaceService } from '../services/GooglePlaceServices';
import ApifyLimitsCard from '../components/ApifyLimitCard';
import { useAnalyzedSpots, useCityAlerts, useDeepAnalysisStatus } from '../hooks/useCityAnalysis';
import { CityAlertsService } from '../services/CityAlertsService';
import MonitoredSpots from '../components/MonitoredSpots';
import SpotInfoPanel from '../components/SpotInfoPanel';
import LastSyncOnCityChoice from '../components/LastSyncOnCityChoice';
import CriticalZones from '../components/CriticalZones';

// Quantos alertas a tabela de Gestão de Ocorrências mostra por vez ("Carregar mais" soma outros 10)
const LIMITE_OCORRENCIAS = 10;

export default function Dashboard() {
  const auth = useAuth();
  const currentUser = auth.currentUser;

  // 1. ESTADOS LOCALIZADOS NO DASHBOARD
  const [searchTerm] = useState('');
  const [resolvendoId, setResolvendoId] = useState<string | null>(null);
  const [falhaResolverId, setFalhaResolverId] = useState<string | null>(null);
  // Quantidade visível na tabela de ocorrências, guardada por cidade (volta a 10 ao trocar de cidade)
  const [ocorrenciasVisiveis, setOcorrenciasVisiveis] = useState<{ cityId?: string | null; total: number }>({ total: LIMITE_OCORRENCIAS });
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  // Spot clicado no mapa (abre o painel de informações)
  const [spotSelecionado, setSpotSelecionado] = useState<TouristSpotDashboard | null>(null);

  const handleSpotClick = useCallback((spot: TouristSpotDashboard) => {
    setSpotSelecionado(spot);
  }, []);
  // Dados da deep analysis da cidade, escutados em tempo real no Firestore
  const cityId = currentUser?.cityChoiceForAnalysis?.placeId;
  const cityName = currentUser?.cityChoiceForAnalysis?.name;
  const analysisStatus = useDeepAnalysisStatus(cityId);
  const mapMarkers = useAnalyzedSpots(cityId);
  const { alerts: alertasAtivos } = useCityAlerts(cityId, cityName, mapMarkers);

  // Função centralizada para disparar a análise no Proxy (Backend Python)
  const triggerBackendAnalysis = useCallback(async (forceRefresh = false) => {
    const city = currentUser?.cityChoiceForAnalysis;
    if (!city || !city.placeId) return;

    try {
      const spotsData = spots
      .filter(s => s.id)
      .map(s => ({
        place_id: s.id,
        name: s.name || "Local",
        lat: s.lat || s.lat, 
        lng: s.lng || s.lng,
        rating : s.rating || 0,
      }));

      const response = await fetch('http://localhost:8000/api/analyze-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: city.placeId,
          city_name: city.name,
          spot_info: spotsData,
          force_refresh: forceRefresh
        })
      });
      const data = await response.json();
      console.log("Status do Proxy:", data);
    } catch (error) {
      console.error("Erro ao disparar análise no backend:", error);
    }
  }, [currentUser, spots]);

  // Dispara a análise automaticamente quando os spots da cidade chegam do Google Places
  useEffect(() => {
    if (spots.length > 0) triggerBackendAnalysis(false);
  }, [triggerBackendAnalysis, spots.length]);

  const handleResolverAlerta = async (id: string) => {
    if (!cityId) return;
    setResolvendoId(id);
    setFalhaResolverId(null);
    try {
      await CityAlertsService.resolve(cityId, id);
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      setFalhaResolverId(id);
    } finally {
      setResolvendoId(null);
    }
  };

  const alertasFiltrados = alertasAtivos.filter(alerta => 
    (alerta.localidade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alerta.problema || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  // A tabela mostra só alertas não resolvidos (useCityAlerts já filtra resolvida == false), de 10 em 10
  const limiteOcorrencias = ocorrenciasVisiveis.cityId === cityId ? ocorrenciasVisiveis.total : LIMITE_OCORRENCIAS;
  const alertasExibidos = alertasFiltrados.slice(0, limiteOcorrencias);
  const haMaisOcorrencias = alertasFiltrados.length > alertasExibidos.length;
  const carregarMaisOcorrencias = () => setOcorrenciasVisiveis({ cityId, total: limiteOcorrencias + LIMITE_OCORRENCIAS });




  // Busca os spots da cidade no Google Places (são eles que vão para a análise profunda no backend)
  useEffect(() => {
    if (!cityName) return;
    let cancelled = false;

    const fetchCitySpots = async () => {
      // O script do Google Maps é carregado pelo DashboardMap; espera ele ficar disponível
      while (!cancelled && !(window as any).google?.maps?.importLibrary) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (cancelled) return;
      await (window as any).google.maps.importLibrary('places');

      const results = await GooglePlaceService.fetchSpots(cityName);
      if (!cancelled) setSpots(results);
    };

    fetchCitySpots();
    return () => { cancelled = true; };
  }, [cityName]);

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
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#041627] tracking-tight">Monitoramento</h2>
              <p className="text-sm text-[#505f76] mt-1 max-w-2xl">
                Acompanhe indicadores de ponto turisticos com o objetivo de identificar perigos turisticos.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <LastSyncOnCityChoice />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <TotalCommentaries />
            
            <Infractions />

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Pontos Sob Risco</p>
                  
                  
                  <UnderRisk />



                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center transition-transform group-hover:scale-105">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
              
               
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Lugares Turisticos Monitorados</p>
                  <MonitoredSpots />
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition-transform group-hover:scale-105">
                  <Radio className="w-6 h-6" />
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  {/* <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 100% Online */}
                </div>
                {/* <span className="text-[#74777d]">Adicionar algo para aqui</span> */}
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
          </div>

          <div className="relative w-full h-[500px] sm:h-[560px] rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#F4F6F8] shadow-inner select-none">
            <DashboardSpotsMap
              spots={mapMarkers} 
              onSpotClick={handleSpotClick}
              height='100%'
            />
            {spotSelecionado && (
              <SpotInfoPanel
                spot={spotSelecionado}
                alertas={alertasAtivos.filter(a =>
                  a.place_id === spotSelecionado.id
                )}
                onClose={() => setSpotSelecionado(null)}
              />
            )}
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

        <CustomAlertsPanel spots={spots} />

        <ApifyLimitsCard/>

        {/* SECTION: ANALYTICS & CRITICAL ZONES */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 scroll-mt-24" id="analitico">
          <InfractionsByCategory />

          <CriticalZones spots={mapMarkers} />
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
                Exibindo <strong>{alertasExibidos.length}</strong> de <strong>{alertasAtivos.length}</strong> alertas ativos
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {alertasExibidos.length === 0 ? (
              <div className="p-12 text-center text-[#74777d]">Nenhum alerta encontrado na base de dados para esta região.</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#F8FAFC] text-[#505f76] text-xs font-bold tracking-wider uppercase border-b border-[#E2E8F0]">
                    <th className="py-3.5 px-6">Localidade</th>
                    <th className="py-3.5 px-6">Problema Detectado</th>
                    <th className="py-3.5 px-6 text-center">Severidade</th>
                    <th className="py-3.5 px-6 text-center">Resolução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-sm text-[#1b1c1d]">
                  {alertasExibidos.map((alerta) => (
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
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleResolverAlerta(alerta.id)}
                          disabled={resolvendoId === alerta.id}
                          className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 inline-flex items-center gap-1 transition-colors disabled:opacity-60 whitespace-nowrap"
                        >
                          {resolvendoId === alerta.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {resolvendoId === alerta.id ? 'Salvando...' : 'Marcar como resolvido'}
                        </button>
                        {falhaResolverId === alerta.id && <p className="text-[11px] text-[#ba1a1a] mt-1">Não foi possível salvar.</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {haMaisOcorrencias && (
            <div className="p-4 border-t border-[#E2E8F0]">
              <button
                onClick={carregarMaisOcorrencias}
                className="w-full py-2 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#44474c] hover:bg-[#F1F5F9] flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" /> Carregar mais {LIMITE_OCORRENCIAS}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}