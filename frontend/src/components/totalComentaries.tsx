import { useEffect, useState } from "react"
import { db } from "../firebaseConfig"
import { collection, getCountFromServer } from "firebase/firestore"

export default function TotalCommentaries(){
    const [totalComments, setTotalComments] = useState<number>(0)
    const fetchTotalComments = async () => {
        const dbRef = collection(db, "analysis_cache")
        try{
            const snapshot = await getCountFromServer(dbRef)
            const count = snapshot.data().count
            setTotalComments(count)
            
            console.log(count)
        }catch(error){
            console.error("Erro ao tentar pegar o total de comentarios: ", error)
        }
    }
    useEffect(() => {
        fetchTotalComments()
    }, [])
    return(
        <div>
            <p className="text-xs font-semibold text-[#505f76] tracking-wider uppercase">Total de Comentários</p>
            <h3 className="text-[36px] font-bold text-[#041627] mt-2 tracking-tight">{ totalComments }</h3>
        </div>
    )
}