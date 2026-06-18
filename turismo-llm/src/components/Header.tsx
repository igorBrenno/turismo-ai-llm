import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { TrendingUp, Search, Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function Header({ searchTerm, setSearchTerm }: HeaderProps) {
  const [notificacoes, setNotificacoes] = useState(3);

  return (
    <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#041627] text-white rounded">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight leading-none">
            TouristWatch<br/><span className="text-[#505f76] text-sm">AI</span>
          </span>
        </div>

        {/* Links de Navegação Funcionais */}
        <nav className="flex items-center gap-2 text-sm font-medium">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-md font-semibold transition-colors ${
                isActive 
                  ? 'bg-[#d2e4fb] text-[#0b1d2d]' 
                  : 'text-[#505f76] hover:text-[#041627]'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/pontos-turisticos" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-md font-semibold transition-colors ${
                isActive 
                  ? 'bg-[#d2e4fb] text-[#0b1d2d]' 
                  : 'text-[#505f76] hover:text-[#041627]'
              }`
            }
          >
            Pontos Turísticos
          </NavLink>
          <NavLink 
            to="/analise-detalhada" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-md font-semibold transition-colors ${
                isActive 
                  ? 'bg-[#d2e4fb] text-[#0b1d2d]' 
                  : 'text-[#505f76] hover:text-[#041627]'
              }`
            }
          >
            Análise Detalhada
          </NavLink>
          <NavLink 
            to="/configuracoes" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-md font-semibold transition-colors ${
                isActive 
                  ? 'bg-[#d2e4fb] text-[#0b1d2d]' 
                  : 'text-[#505f76] hover:text-[#041627]'
              }`
            }
          >
            Configurações
          </NavLink>
        </nav>
      </div>

      {/* Busca & Perfil */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#74777d] absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Pesquisar local ou problema..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#f5f3f4] border-none rounded-md text-sm w-60 focus:outline-none focus:ring-2 focus:ring-[#041627] transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 text-[#505f76]">
          <button className="relative p-1 hover:text-[#041627]" onClick={() => { setNotificacoes(0); alert('Notificações limpas'); }}>
            <Bell className="w-5 h-5" />
            {notificacoes > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full animate-pulse"></span>
            )}
          </button>
          <button className="p-1 hover:text-[#041627]" onClick={() => alert('Suporte central: suporte@touristwatch.ai')}>
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-l border-[#E2E8F0] pl-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-[#1b1c1d]">Admin Manager</p>
            <p className="text-xs text-[#74777d]">Level 1</p>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
            alt="Avatar" 
            className="w-9 h-9 rounded-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}