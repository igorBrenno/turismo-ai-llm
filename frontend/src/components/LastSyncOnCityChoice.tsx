import { Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

const formatLastSync = (date: Date | null): string => {
    if (!date) return "Nunca";

    const now = new Date();
    const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString()) return `Hoje, ${time}`;
    if (date.toDateString() === yesterday.toDateString()) return `Ontem, ${time}`;

    return `${date.toLocaleDateString("pt-BR")}, ${time}`;
};

export default function LastSyncOnCityChoice() {
    const auth = useAuth();
    const cityId = auth.currentUser?.cityChoiceForAnalysis?.placeId;
    const [lastSync, setLastSync] = useState<Date | null>(null);

    useEffect(() => {
        if (!cityId) {
            setLastSync(null);
            return;
        }

        const docRef = doc(db, "deep_analysis_status", cityId);
        const unsubscribe = onSnapshot(
            docRef,
            (snap) => {
                const lastAnalyzed = snap.exists() ? snap.data().last_analyzed : null;
                setLastSync(lastAnalyzed instanceof Timestamp ? lastAnalyzed.toDate() : null);
            },
            (error) => {
                console.error("Erro ao buscar última sincronização:", error);
            }
        );

        return () => unsubscribe();
    }, [cityId]);

    return (
        <span className="flex items-center text-xs text-[#505f76] bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg shadow-sm font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5" /> Última sincronização:{" "}
            <strong className="text-[#041627] ml-1">{formatLastSync(lastSync)}</strong>
        </span>
    );
}
