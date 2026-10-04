import { useEffect, useState } from "react"
import { db } from "../firebaseConfig"
import { collection, getCountFromServer, query, Timestamp, where } from "firebase/firestore"
import { MessageSquare } from "lucide-react"

export default function TotalCommentaries(){
    const [totalComments, setTotalComments] = useState<number>(0)
    const [ commentsPercentage, setCommentsPercentage] = useState<number>(0)
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
    const commentsPercent = async () => {
        const dbRef = collection(db, "analysis_cache")
        const oneMonthBefore = new Date()
        oneMonthBefore.setDate(oneMonthBefore.getDate() - 30)
        try{
            const snapshotCount = await getCountFromServer(dbRef)
            const count = snapshotCount.data().count
            const qPast = query(
                dbRef, 
                where("createdAt", "<=", Timestamp.fromDate(oneMonthBefore))
            );
            const snapPast = await getCountFromServer(qPast);
            const pastCount = snapPast.data().count;
            if(count === 0 || pastCount === 0){
                setCommentsPercentage(count * 100);
            }
            else{
                const percentage = (( count - pastCount ) / pastCount) * 100
                setCommentsPercentage(percentage);
            }
            console.log(count, pastCount)
        }catch(error){
            console.error("Erro ao tentar pegar o total de porcentagem comentarios: ", error)
        }
    }
    useEffect(() => {
        fetchTotalComments();
        commentsPercent();
    }, [])
    return(
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-[#505f76] tracking-wider uppercase">Total de Comentários</p>
                    <h3 className="text-[36px] font-bold text-[#041627] mt-2 tracking-tight">{ totalComments }</h3>
                </div>
                <div className="p-2 text-[#74777d]">
                    <MessageSquare className="w-5 h-5" />
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 text-xs text-[#74777d]">
                <span className="text-[#128049] font-semibold flex items-center gap-0.5">↗ { commentsPercentage }%</span>
                <span>Comparado ao mês passado(30 dias atrás)</span>
            </div>
        </div>
    )
}