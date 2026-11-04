import {  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth} from "../firebaseConfig";
import { getUserDocument, setPersistenceType, setUserDocumentOnRegister, userAuthChange } from "../utils/Firebase";

export interface cityChoice {
    name : string,
    lat : number,
    lng : number, 
    placeId : string | null,
}


export interface userAuth{
    uid : string,
    email : string,
    userName : string,
    cityChoiceForAnalysis : cityChoice | null,
    
}


interface AuthContextData{
    currentUser : userAuth | null;
    setCurrentUser : (user : userAuth) => void;
    loading : boolean;
    signIn : (email : string, password : string, rememberMe : boolean) => Promise<void>;
    signUp : ( email : string, password : string, city : cityChoice) => Promise<void>;
}

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthContextProvider( {children} : { children:ReactNode}){
    const [currentUser, setCurrentUser] =  useState<userAuth | null>(null)
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
      setLoading(true)
      const unsubscribe = onAuthStateChanged( auth, async (firebaseUser) => {
        await userAuthChange(firebaseUser, setCurrentUser);
        setLoading(false);
        

      })

      return () => unsubscribe();
    },[])

    



    const signIn = async (email : string, password : string, rememberMe : boolean) => {
        setLoading(true);
        try {
            // Configura a persistência baseada no checkbox "Lembrar-me"
            setPersistenceType(rememberMe)
    
            // Executa a autenticação no Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const data = await getUserDocument(userCredential.user.uid);
            console.log(data)
            const treatedCityChoice : cityChoice | null = data?.cityChoiceForAnalysis ? {
                name : data?.cityChoiceForAnalysis.name,
                lat : data?.cityChoiceForAnalysis.lat ,
                lng : data?.cityChoiceForAnalysis.lng ,
                placeId : data?.cityChoiceForAnalysis.place_id,
            } : null;
            console.log('Login efetuado com sucesso no Firebase:', userCredential.user);
            setCurrentUser({
                uid : userCredential.user.uid,
                email : userCredential.user.email ?? email,
                userName : userCredential.user.displayName ?? email,
                cityChoiceForAnalysis : treatedCityChoice,
            })
            
        } catch (error: any) {
            console.error('Erro ao fazer login:', error);
            throw error;
            // Tratamento amigável para mensagens de erro comuns do Firebase
        } finally {
            setLoading(false);
            console.log(currentUser)
        }
        };
    
    const signUp = async ( email : string, password : string, city : cityChoice) => {
        setLoading(true)
        try{
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
           
            await setUserDocumentOnRegister(userCredential, city)
            setCurrentUser({
                uid : userCredential.user.uid,
                email : userCredential.user.email ?? email,
                userName : userCredential.user.displayName ?? email,
                cityChoiceForAnalysis : city ?? null,
            })

        } catch(error){
            console.error(`Erro no processo de registrar conta, erro:  ${error}`);
        }finally{
            setLoading(false)
        }
    }







    return(
        <AuthContext.Provider value={{ currentUser, setCurrentUser, signIn, loading, signUp}}>
            { children }
        </AuthContext.Provider>
    )

}


export function useAuth(){
    const context = useContext(AuthContext);
    if(!context){
        throw new Error("O context do auth não devia estar aí...")
    }
    return context;
}