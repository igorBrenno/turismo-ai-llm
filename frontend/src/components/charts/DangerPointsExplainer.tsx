import { ShieldAlert } from 'lucide-react';

export default function DangerPointsExplainer() {
  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 shrink-0 text-[#ba1a1a] mt-0.5" />
      <p className="text-sm text-[#505f76] max-w-3xl">
        <strong className="text-[#041627]">Pontos de perigo:</strong> cada relato de perigo encontrado pela IA soma
        pontos conforme a gravidade, e o índice é medido a cada 100 reviews. Assim, crimes pesam mais que problemas
        leves e pontos com muitas ou poucas avaliações podem ser comparados.
      </p>
    </section>
  );
}
