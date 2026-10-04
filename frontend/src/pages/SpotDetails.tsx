import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Quote, 
  Loader2 
} from 'lucide-react';
import type {AIAnalysis } from '../models/Ai';
import type {Review } from '../models/Spot'
import SpotsMap from '../components/Map';





export default function SpotDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  

  // Estados para gerenciar os dados da API
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analiseIa, setAnaliseIa] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  // Recupera o objeto enviado pelo estado da navegação
  const spot = location.state?.spot;

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        // Chamada para o seu backend em Python
        const response = await fetch(`http://localhost:8000/api/spots/${id}/reviews`);
        const data = await response.json();
        
        setReviews(data.reviews || []);
        setAnaliseIa(data.analise_ia || null);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    if (spot) {
      fetchData();
    }
  }, [id, spot]);

  // Define as cores e ícones baseados no nível de risco retornado pela IA
  const getRiskStyle = (nivel: string) => {
    switch (nivel) {
      case 'Alto':
        return { 
          bg: 'bg-[#ffdad6]/30', 
          border: 'border-[#ba1a1a]', 
          text: 'text-[#ba1a1a]', 
          icon: <ShieldAlert className="w-6 h-6 text-[#ba1a1a]" /> 
        };
      case 'Médio':
        return { 
          bg: 'bg-yellow-50', 
          border: 'border-yellow-500', 
          text: 'text-yellow-700', 
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" /> 
        };
      default: // Baixo
        return { 
          bg: 'bg-green-50', 
          border: 'border-green-500', 
          text: 'text-green-700', 
          icon: <ShieldCheck className="w-6 h-6 text-green-600" /> 
        };
    }
  };

  if (!spot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9fa] p-6">
        <p className="text-sm text-[#44474c] mb-4">Ponto turístico não encontrado ou acesso direto sem dados.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-[#041627] hover:bg-[#1a2b3c] transition-colors text-white text-xs font-bold py-2.5 px-5 rounded-lg uppercase tracking-widest"
        >
          Voltar para a busca
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9fa] text-[#1b1c1d] flex flex-col">
      {/* O Header geralmente fica fora do padding principal para ocupar a largura total, dependendo da sua implementação */}
      <div className="p-6 pb-0">
       
      </div>

      <div className="max-w-3xl mx-auto w-full p-6 space-y-8 flex-1">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#041627] hover:text-[#44474c] transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Card Principal do Ponto Turístico */}
        <div className="bg-white border border-[#c4c6cd] rounded-xl overflow-hidden shadow-sm">
          <div className="h-72 bg-[#e4e2e3] relative">
            <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover" />
            {spot.rating && (
              <span className="absolute top-4 right-4 bg-[#041627]/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {spot.rating}
              </span>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1b1c1d]">
              Localização no Mapa
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">{spot.name}</h1>
            <div className="flex items-center gap-2 text-sm text-[#44474c]">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="leading-relaxed">{spot.description}</span>
            </div>
          </div>
        </div>
        <SpotsMap 
          spots={[]} 
          selectedSpot={spot} 
          height="300px" 
        />

        {/* Estado de Carregamento da IA */}
        {loading ? (
          <div className="flex flex-col items-center py-12 gap-3 bg-white border border-[#c4c6cd] rounded-xl shadow-sm">
            <Loader2 className="w-8 h-8 text-[#041627] animate-spin" />
            <p className="text-sm font-medium text-[#44474c]">Processando avaliações com Inteligência Artificial...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Seção de Análise da IA */}
            {analiseIa && (
              <section className={`p-6 rounded-xl border ${getRiskStyle(analiseIa.nivel_risco).bg} ${getRiskStyle(analiseIa.nivel_risco).border}`}>
                <div className="flex items-center gap-3 mb-4">
                  {getRiskStyle(analiseIa.nivel_risco).icon}
                  <h2 className={`text-xl font-bold ${getRiskStyle(analiseIa.nivel_risco).text}`}>
                    Análise de Segurança: Risco {analiseIa.nivel_risco}
                  </h2>
                </div>
                
                <p className="text-[#1b1c1d] font-medium mb-6 leading-relaxed">
                  {analiseIa.resumo}
                </p>

                {analiseIa.alertas.length > 0 ? (
                  <div className="space-y-4 mt-6 border-t border-black/10 pt-6">
                    <h3 className="text-xs font-bold text-[#1b1c1d] uppercase tracking-widest mb-4">
                      Incidentes Relatados ({analiseIa.alertas.length})
                    </h3>
                    
                    {analiseIa.alertas.map((alerta, index) => (
                      <div key={index} className="bg-white p-5 rounded-lg border border-[#c4c6cd] shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="bg-[#041627] text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider">
                            {alerta.tag}
                          </span>
                        </div>
                        
                        <p className="text-sm font-bold text-[#1b1c1d]">
                          {alerta.descricao}
                        </p>
                        
                        <div className="bg-[#f5f3f4] p-3 rounded-md flex gap-2 items-start mt-1">
                          <Quote className="w-4 h-4 text-[#74777d] shrink-0 mt-0.5" />
                          <p className="text-xs text-[#54647a] italic leading-relaxed">
                            "{alerta.citacao}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-green-700 font-bold">Nenhum incidente grave de segurança encontrado nos relatos recentes.</p>
                  </div>
                )}
              </section>
            )}

            {/* Seção de Comentários Brutos */}
            {reviews.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#1b1c1d]">Últimas Avaliações</h3>
                  <span className="text-xs font-bold text-[#44474c] bg-[#e4e2e3] px-2.5 py-1 rounded-full">
                    {reviews.length} relatos
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {reviews.slice(0, 10).map((review, index) => (
                    <div key={index} className="p-5 bg-white rounded-xl border border-[#c4c6cd] shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-bold text-sm text-[#1b1c1d]">{review.author}</span>
                        <span className="text-xs font-bold bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          {review.rating}
                        </span>
                      </div>
                      <p className="text-sm text-[#44474c] leading-relaxed line-clamp-4">{review.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}