import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './Dashboard';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <BrowserRouter>
      <div className="bg-[#F8FAFC] min-h-screen font-sans text-[#1b1c1d] flex flex-col justify-between">
        
        {/* O Header fica fixo no topo em todas as páginas e recebe a busca */}
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        {/* Gerenciamento das Rotas */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard searchTerm={searchTerm} />} />
            
            <Route path="/analise-detalhada" element={
              <div className="p-6 max-w-[1400px] mx-auto">
                <h2 className="text-2xl font-bold text-[#041627]">Análise Detalhada AI</h2>
                <p className="text-[#505f76] mt-2">Gráficos avançados e relatórios preditivos.</p>
              </div>
            } />
            
            <Route path="/configuracoes" element={
              <div className="p-6 max-w-[1400px] mx-auto">
                <h2 className="text-2xl font-bold text-[#041627]">Configurações do Sistema</h2>
                <p className="text-[#505f76] mt-2">Ajuste de parâmetros dos modelos de IA.</p>
              </div>
            } />
          </Routes>
        </div>

        {/* FOOTER GLOBAL */}
        <footer className="bg-white border-t border-[#E2E8F0] py-4 px-6 text-xs text-[#74777d] mt-12">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© 2026 TouristWatch AI. Todos os direitos reservados.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Política de Privacidade</a>
              <a href="#" className="hover:underline">Termos de Uso</a>
            </div>
          </div>
        </footer>

      </div>
    </BrowserRouter>
  );
}