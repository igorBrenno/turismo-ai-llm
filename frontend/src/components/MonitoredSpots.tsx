import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext"
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function MonitoredSpots(){
    const auth = useAuth();
    const [monitoredSpots, setMonitoredSpots] = useState<number | null>(null);

    const fetchMonitoredSpots = async () => {
        const cityId = auth.currentUser?.cityChoiceForAnalysis?.placeId;
        if(!cityId) return;

        try{
            const collectionRef = collection(db, "deep_analysis_status", cityId, "spots")
            const snapshot = await getDocs(collectionRef);

            const countSpots = snapshot.size

            setMonitoredSpots(countSpots)
        }catch(error){
            console.error(`Erro ao tentar pegar os spots que foram monitorados`)
        }

    }
    useEffect(() => {
        fetchMonitoredSpots()
    }, [])

    return(
        <h3 className="text-3xl sm:text-4xl font-extrabold text-[#041627] mt-2 tracking-tight">{monitoredSpots}</h3>
    )
}