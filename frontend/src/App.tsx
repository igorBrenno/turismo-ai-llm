import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import Login from './pages/login'
import Register from './pages/register'
import Profile from './pages/profile-settings'
import Pesquisa from './pages/city-search'
import SpotDetails from './pages/SpotDetails'
import AlertRules from './pages/alert-rules'
import { SearchContextProvider } from './contexts/SearchContext';
import MainLayout from './layouts/MainLayout';
import { AuthContextProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
export default function App() {
  


  function PrivateRoutes(){
    const {currentUser, loading} = useAuth();
    if(loading){
      return <div className="min-h-screen flex items-center justify-center">Verificando sessão...</div>;
    }
    return currentUser ? <Outlet/> : <Navigate to ="/" replace/>
  }
  
  return (
    <AuthContextProvider>
      <SearchContextProvider>  
        <BrowserRouter>
          <Routes>
            {/* Rota pública de login - não exibe o Header */}
            <Route path="/" element={<Login />} />
            {/* Rota de registro */}
            <Route path='/register' element={<Register/>}/>
            <Route element={<PrivateRoutes />} >



              <Route path='/profile' element={<Profile/>}/>

              <Route element = {<MainLayout />}>
                {/* Rotas administrativas - O Dashboard renderiza seu próprio Header */}
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path='/pesquisa' element={<Pesquisa/>}/>

                <Route path="/spot/:id" element={<SpotDetails />} />

                <Route path='/alertas' element={<AlertRules/>}/>

                {/* <Route path="/pontos-turisticos" element={<PontosTuristicos />} /> */}
                
                <Route path="/analise-detalhada" element={
                  <div className="p-6 max-w-[1400px] mx-auto">
                    <h2 className="text-2xl font-bold text-[#041627]">Análise Detalhada AI</h2>
                  </div>
                } />
                
                <Route path="/configuracoes" element={
                  <div className="p-6 max-w-[1400px] mx-auto">
                    <h2 className="text-2xl font-bold text-[#041627]">Configurações</h2>
                  </div>
              } />
            </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ SearchContextProvider>
    </AuthContextProvider>
  );
}