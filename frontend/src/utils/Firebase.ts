import { browserLocalPersistence, browserSessionPersistence, setPersistence } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { cityChoice } from "../contexts/AuthContext";
export const setPersistenceType = async (rememberMe : boolean) => {
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);
}


export async function getUserDocument( userUid : string){
    const docSnap = await getDoc(doc(db, 'users', userUid))
    const data = docSnap.data()
    console.log(data)
    return data;
}

export async function setUserDocumentOnRegister( userCredential : any, city : cityChoice | null){
    const docRef = doc(db, 'users', userCredential.user.uid)
    
    await setDoc(docRef, {
        email : userCredential.user.email,
        username : userCredential.user.displayName,
        createdAt: new Date().toISOString(),
        cityChoiceForAnalysis : city,
        user_uid : userCredential.user.uid,
    })

    console.log(`Documento salvo no firebase com id: ${userCredential.user.uid}`)
}

export const userAuthChange = async (firebaseUser : any, setCurrentUser : any) => {
    if(firebaseUser){
        const data = await getUserDocument(firebaseUser.uid)
        const cityChoice = data?.cityChoiceForAnalysis
        const treatedCityChoice : cityChoice | null = cityChoice ? {
            name : cityChoice.name,
            lat : cityChoice.lat,
            lng : cityChoice.lng,
            placeId : cityChoice.placeId,
        } : null;
        setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            userName: firebaseUser.displayName ?? firebaseUser.email ?? '',
            cityChoiceForAnalysis: treatedCityChoice,
        })

    }else{
        setCurrentUser(null)
    }
}