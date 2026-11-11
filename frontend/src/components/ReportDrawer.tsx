/// <reference types="google.maps" />

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { CheckCircle2, Loader2, Megaphone, X } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { ReportService } from '../services/ReportService';
import { TIPO_PERIGO_LABELS, type TipoPerigo, type UserReport } from '../models/Report';

interface ReportDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: (report: UserReport) => void;
}

interface SelectedPlace {
  id: string;
  name: string;
  address?: string;
}

const MIN_DESCRICAO = 10;
const MAX_DESCRICAO = 2000;
const MAPS_TIMEOUT_MS = 15000;
// Raio aproximado, em graus, usado para limitar a busca à cidade do usuário.
const CITY_RADIUS_DEG = 0.25;

const fieldClass =
  'w-full border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm bg-white text-[#1b1c1d] focus:outline-none focus:ring-2 focus:ring-[#041627] disabled:bg-slate-100';
const labelClass = 'block text-xs font-bold text-[#44474c] mb-1.5';

function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function ReportDrawer({ open, onClose, onCreated }: ReportDrawerProps) {
  const { currentUser } = useAuth();
  const city = currentUser?.cityChoiceForAnalysis;
  const cityLat = city?.lat;
  const cityLng = city?.lng;

  const inputRef = useRef<HTMLInputElement>(null);
  const [placesReady, setPlacesReady] = useState(false);
  const [placesFailed, setPlacesFailed] = useState(false);
  const [place, setPlace] = useState<SelectedPlace | null>(null);
  const [tipoPerigo, setTipoPerigo] = useState<TipoPerigo | ''>('');
  const [descricao, setDescricao] = useState('');
  const [dataOcorrencia, setDataOcorrencia] = useState('');
  const [rating, setRating] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // O script do Google é carregado pelo mapa do dashboard, então aguardamos ele aparecer.
  useEffect(() => {
    let cancelled = false;
    let autocomplete: google.maps.places.Autocomplete | null = null;
    const startedAt = Date.now();

    const init = async () => {
      try {
        const { Autocomplete } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
        if (cancelled || !inputRef.current) return;

        const options: google.maps.places.AutocompleteOptions = {
          types: ['establishment'],
          fields: ['place_id', 'name', 'formatted_address'],
        };
        if (cityLat !== undefined && cityLng !== undefined) {
          options.bounds = {
            north: cityLat + CITY_RADIUS_DEG,
            south: cityLat - CITY_RADIUS_DEG,
            east: cityLng + CITY_RADIUS_DEG,
            west: cityLng - CITY_RADIUS_DEG,
          };
          options.strictBounds = true;
        }

        const instance = new Autocomplete(inputRef.current, options);
        autocomplete = instance;
        instance.addListener('place_changed', () => {
          const result = instance.getPlace();
          setPlace(
            result.place_id && result.name
              ? { id: result.place_id, name: result.name, address: result.formatted_address }
              : null,
          );
        });
        setPlacesReady(true);
      } catch (e) {
        console.error('Erro ao iniciar a busca de atrações:', e);
        if (!cancelled) setPlacesFailed(true);
      }
    };

    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && typeof google.maps?.importLibrary === 'function') {
        clearInterval(interval);
        init();
      } else if (Date.now() - startedAt > MAPS_TIMEOUT_MS) {
        clearInterval(interval);
        setPlacesFailed(true);
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [cityLat, cityLng]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSubmitted(false);
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const resetForm = () => {
    if (inputRef.current) inputRef.current.value = '';
    setPlace(null);
    setTipoPerigo('');
    setDescricao('');
    setDataOcorrencia('');
    setRating('');
    setError('');
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const justificativa = descricao.trim();
    if (!place) return setError('Selecione a atração turística na lista de sugestões.');
    if (!tipoPerigo) return setError('Selecione o motivo da denúncia.');
    if (justificativa.length < MIN_DESCRICAO) {
      return setError(`Descreva o ocorrido com pelo menos ${MIN_DESCRICAO} caracteres.`);
    }
    if (!dataOcorrencia) return setError('Informe a data da ocorrência.');
    if (dataOcorrencia > todayLocal()) return setError('A data da ocorrência não pode estar no futuro.');

    setSubmitting(true);
    setError('');
    try {
      const created = await ReportService.create({
        place_id: place.id,
        place_name: place.name,
        place_address: place.address,
        tipo_perigo: tipoPerigo,
        justificativa,
        data_ocorrencia: dataOcorrencia,
        rating: rating ? Number(rating) : undefined,
      });
      onCreated(created);
      resetForm();
      setSubmitted(true);
    } catch (e) {
      console.error('Erro ao registrar denúncia:', e);
      setError(
        e instanceof TypeError
          ? 'Não foi possível conectar ao servidor. Tente novamente.'
          : (e as Error).message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[900] ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-[#041627]/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-drawer-title"
        className={`absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col transition-all duration-300 ${
          open ? 'translate-x-0 visible' : 'translate-x-full invisible'
        }`}
      >
        <header className="flex items-start justify-between gap-4 p-6 border-b border-[#E2E8F0]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#505f76] mb-0.5">
              <Megaphone className="w-3.5 h-3.5" /> Canal do usuário
            </div>
            <h2 id="report-drawer-title" className="text-xl font-bold text-[#041627]">
              Faça sua denúncia
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#041627] transition-colors"
            aria-label="Fechar formulário"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {submitted ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center gap-3 p-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            <h3 className="text-lg font-bold text-[#041627]">Denúncia registrada</h3>
            <p className="text-sm text-[#505f76]">
              Ela ficará pendente até ser validada e não altera os indicadores do painel antes disso.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 px-5 py-2.5 rounded-lg bg-[#041627] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex-grow flex flex-col min-h-0">
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-5">
              <div>
                <label htmlFor="report-place" className={labelClass}>Atração turística</label>
                <input
                  id="report-place"
                  ref={inputRef}
                  type="text"
                  autoComplete="off"
                  disabled={!placesReady}
                  placeholder={
                    placesFailed
                      ? 'Busca indisponível no momento'
                      : placesReady
                        ? `Busque um local${city?.name ? ` em ${city.name}` : ''}`
                        : 'Carregando busca...'
                  }
                  onChange={() => setPlace(null)}
                  onKeyDown={(event) => {
                    // O Enter confirma a sugestão do Google em vez de enviar o formulário.
                    if (event.key === 'Enter') event.preventDefault();
                  }}
                  className={fieldClass}
                />
                {place?.address && <p className="text-xs text-[#74777d] mt-1.5">{place.address}</p>}
              </div>

              <div>
                <label htmlFor="report-motivo" className={labelClass}>Motivo</label>
                <select
                  id="report-motivo"
                  value={tipoPerigo}
                  onChange={(event) => setTipoPerigo(event.target.value as TipoPerigo | '')}
                  className={fieldClass}
                >
                  <option value="">Selecione o motivo</option>
                  {(Object.keys(TIPO_PERIGO_LABELS) as TipoPerigo[]).map((tipo) => (
                    <option key={tipo} value={tipo}>{TIPO_PERIGO_LABELS[tipo]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="report-descricao" className={labelClass}>Descrição do ocorrido</label>
                <textarea
                  id="report-descricao"
                  rows={5}
                  maxLength={MAX_DESCRICAO}
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Conte o que aconteceu, quando e quem estava envolvido."
                  className={`${fieldClass} resize-none`}
                />
                <p className="text-[11px] text-[#74777d] mt-1 text-right">
                  {descricao.length}/{MAX_DESCRICAO}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="report-data" className={labelClass}>Data da ocorrência</label>
                  <input
                    id="report-data"
                    type="date"
                    max={todayLocal()}
                    value={dataOcorrencia}
                    onChange={(event) => setDataOcorrencia(event.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="report-nota" className={labelClass}>Nota do local (opcional)</label>
                  <select
                    id="report-nota"
                    value={rating}
                    onChange={(event) => setRating(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Sem nota</option>
                    {[1, 2, 3, 4, 5].map((nota) => (
                      <option key={nota} value={nota}>{nota}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <footer className="p-6 border-t border-[#E2E8F0] space-y-3">
              {error && (
                <p role="alert" className="text-xs font-medium text-[#ba1a1a] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-5 py-2.5 rounded-lg bg-[#041627] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Enviando...' : 'Enviar denúncia'}
              </button>
            </footer>
          </form>
        )}
      </aside>
    </div>
  );
}
