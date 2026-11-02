import { collection, getCountFromServer, query, where } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Infractions(){
    const [infractions, setInfractions] = useState<number>(0)
    const auth = useAuth()
    const fetchInfractions = async () => {
        const cityId = auth.currentUser?.cityChoiceForAnalysis?.placeId

        const dbRef = collection(db, `deep_analysis_status/${cityId}/alerts`);
        try{
            const q = query( dbRef , where("resolvida", "==", false))
            const snapshot = await getCountFromServer(q)
            const count =  snapshot.data().count
            setInfractions(count)

        }catch(error){
            console.log("Erro ao tentar pegar as infrações: " ,error)
        }
    }
    useEffect( () => {
        fetchInfractions()
    }, [])

    return(
        <h3 className="text-[36px] font-bold text-[#041627] mt-2 tracking-tight">0{infractions}</h3>
    )
}