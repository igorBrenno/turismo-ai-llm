import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { collection,getDocs, QuerySnapshot } from "firebase/firestore"
import { db } from "../firebaseConfig"
export default function UnderRisk(){
    const [underRisk, setUnderRisk] = useState(0)
    const auth = useAuth()

    const cityId = auth.currentUser?.cityChoiceForAnalysis?.placeId

    const fetchUderRiskVariable = async () => {
        if(!cityId) return;
        

        try{
            const statusRef = collection(db, "deep_analysis_status", cityId, "alerts")
            const statusSnapshot = await getDocs(statusRef)
            const data = statusSnapshot.docs.map(doc => ({
                id : doc.id,
                ...doc.data() as { place_id : string}
            }))
            const spotsUnited = new Set()
            
            for (const alert of data){
                if(alert.place_id){
                    spotsUnited.add(alert.place_id)
                }
            }
            const countOfUnderRisk = spotsUnited.size
            setUnderRisk(countOfUnderRisk)

        }catch(error){
            console.error("Erro ao tentar pegar a variavel de sob risco: ", error)
        }
    }

    useEffect(() => {
        fetchUderRiskVariable()
    }, [cityId])



    return(
        <h3 className="text-3xl sm:text-4xl font-extrabold text-[#041627] mt-2 tracking-tight">0{underRisk}</h3>
    )
}