import { ChevronDown } from 'lucide-react';
import { PAGE_SIZE } from '../../hooks/useSpotDetails';

interface LoadMoreButtonProps {
  onClick: () => void;
}

export default function LoadMoreButton({ onClick }: LoadMoreButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#44474c] hover:bg-[#F1F5F9] flex items-center justify-center gap-1 transition-colors"
    >
      <ChevronDown className="w-3.5 h-3.5" /> Carregar mais {PAGE_SIZE}
    </button>
  );
}
