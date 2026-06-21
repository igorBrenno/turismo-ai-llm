import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import Login from './pages/login'
import Register from './pages/register'
import Profile from './pages/profile-settings'
// import PontosTuristicos from './pages/PontosTuristicos';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública de login - não exibe o Header */}
        <Route path="/" element={<Login />} />

        {/* Rota de registro */}
        <Route path='/register' element={<Register/>}/>

        <Route path='/profile' element={<Profile/>}/>

        {/* Rotas administrativas - O Dashboard renderiza seu próprio Header */}
        <Route path="/dashboard" element={<Dashboard />} />
        
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
      </Routes>
    </BrowserRouter>
  );
}