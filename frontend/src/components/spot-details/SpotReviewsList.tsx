import { MessageSquare, Star } from 'lucide-react';
import type { PagedList, SpotReview } from '../../hooks/useSpotDetails';
import LoadMoreButton from './LoadMoreButton';

export default function SpotReviewsList({ reviews }: { reviews: PagedList<SpotReview> }) {
  const { items, total, hasMore, loadMore } = reviews;

  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-base font-bold text-[#041627] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#505f76]" /> Reviews analisadas ({total ?? items.length})
        </h3>
        <p className="text-[11px] text-[#74777d] mt-0.5">Reviews com texto coletadas na varredura (até 30 por ponto).</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#74777d]">Nenhuma review salva para este ponto.</p>
      ) : (
        <ul className="divide-y divide-[#F1F5F9]">
          {items.map(review => (
            <li key={review.id} className="py-3 space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-[#041627]">{review.author || 'Anônimo'}</span>
                <span className="flex items-center gap-2 text-[#74777d]">
                  {review.date}
                  {review.rating != null && (
                    <span className="flex items-center gap-0.5 font-semibold text-amber-600">
                      <Star className="w-3 h-3 fill-current" /> {review.rating}
                    </span>
                  )}
                </span>
              </div>
              <p className="text-sm text-[#44474c]">{review.text || 'Sem texto.'}</p>
            </li>
          ))}
        </ul>
      )}

      {hasMore && <LoadMoreButton onClick={loadMore} />}
    </section>
  );
}
