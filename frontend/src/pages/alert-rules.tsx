import { useEffect, useState } from 'react';
import { BellRing, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AlertRulesService } from '../services/AlertRulesService';
import type { AlertRule } from '../models/AlertRule';

export default function AlertRules() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const [rules, setRules] = useState<AlertRule[]>([]);
  const [nome, setNome] = useState('');
  const [criterio, setCriterio] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!uid) return;
    return AlertRulesService.subscribeRules(uid, setRules);
  }, [uid]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !nome.trim() || !criterio.trim()) return;

    setSaving(true);
    setErrorMessage('');
    try {
      await AlertRulesService.createRule(uid, nome.trim(), criterio.trim());
      setNome('');
      setCriterio('');
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      setErrorMessage('Não foi possível salvar o alerta. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: AlertRule) => {
    if (!uid) return;
    await AlertRulesService.setRuleActive(uid, rule.id, !rule.ativo);
  };

  const handleDelete = async (rule: AlertRule) => {
    if (!uid || !confirm(`Excluir o alerta "${rule.nome}"?`)) return;
    await AlertRulesService.deleteRule(uid, rule.id);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#505f76] mb-1">
          <span className="w-2 h-2 rounded-full bg-[#041627]"></span>
          {currentUser?.cityChoiceForAnalysis?.name ?? 'Sua cidade'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#041627] tracking-tight">Meus Alertas</h2>
        <p className="text-sm text-[#505f76] mt-1 max-w-2xl">
          Descreva o que a IA deve procurar nos comentários dos pontos da sua cidade. Depois, use o botão
          "Verificar novos comentários" no Dashboard para encontrar os comentários que se encaixam.
        </p>
      </div>

      <form onSubmit={handleCreate} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#041627] tracking-wide" htmlFor="alertName">Nome do alerta</label>
          <input
            id="alertName"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Acessibilidade"
            maxLength={60}
            className="w-full px-4 py-2.5 bg-[#fbf9fa] border border-[#c4c6cd] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#041627] focus:border-[#041627]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#041627] tracking-wide" htmlFor="alertCriteria">O que procurar nos comentários?</label>
          <textarea
            id="alertCriteria"
            value={criterio}
            onChange={(e) => setCriterio(e.target.value)}
            placeholder="Ex.: o comentário denuncia algum problema de acessibilidade (falta de rampa, banheiro adaptado, calçada irregular...)"
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2.5 bg-[#fbf9fa] border border-[#c4c6cd] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#041627] focus:border-[#041627] resize-y"
          />
          <p className="text-[11px] text-[#74777d]">A IA responderá "sim" ou "não" para cada comentário com base neste critério.</p>
        </div>
        {errorMessage && <p className="text-xs text-[#ba1a1a] font-semibold">{errorMessage}</p>}
        <button
          type="submit"
          disabled={saving || !nome.trim() || !criterio.trim()}
          className="bg-[#041627] hover:bg-[#1a2b3c] text-white font-bold text-xs rounded-lg py-3 px-6 transition-all shadow-sm uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Plus className="w-4 h-4" /> {saving ? 'Salvando...' : 'Criar alerta'}
        </button>
      </form>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#041627] uppercase tracking-wider">Alertas configurados ({rules.length})</h3>

        {rules.length === 0 && (
          <div className="bg-white border border-dashed border-[#c4c6cd] rounded-xl p-8 text-center text-sm text-[#505f76]">
            Nenhum alerta criado ainda.
          </div>
        )}

        {rules.map((rule) => (
          <div key={rule.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-sm flex items-start gap-4">
            <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${rule.ativo ? 'bg-[#d2e4fb] text-[#041627]' : 'bg-slate-100 text-slate-400'}`}>
              <BellRing className="w-5 h-5" />
            </div>
            <div className="flex-grow min-w-0">
              <p className={`font-bold ${rule.ativo ? 'text-[#041627]' : 'text-slate-400'}`}>{rule.nome}</p>
              <p className="text-sm text-[#505f76] mt-0.5 break-words">{rule.criterio}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleToggle(rule)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  rule.ativo
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-[#E2E8F0] text-[#505f76] hover:bg-slate-50'
                }`}
              >
                {rule.ativo ? 'Ativo' : 'Pausado'}
              </button>
              <button
                onClick={() => handleDelete(rule)}
                className="p-2 rounded-lg text-[#ba1a1a] hover:bg-red-50 transition-colors"
                title="Excluir alerta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
