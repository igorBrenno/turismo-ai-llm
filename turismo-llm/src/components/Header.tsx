import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { TrendingUp, Search, Bell, HelpCircle, LogOut, User } from 'lucide-react';
import { signOut } from 'firebase/auth'; // Import do método de logout do Firebase
import { auth } from '../firebaseConfig'; // Substitui a importação do supabase
import { useProfile } from '../hooks/useProfile';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function Header({ searchTerm, setSearchTerm }: HeaderProps) {
  const [notificacoes, setNotificacoes] = useState(3);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  
  const navigate = useNavigate();
  const { profile, loading } = useProfile(); // Puxa os dados reais do banco ou fallback

  const handleLogout = async () => {
    try {
      setMenuPerfilAberto(false);
      // Remove a sessão do usuário no Firebase
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleProfile = () => {
    setMenuPerfilAberto(false);
    navigate('/profile');
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#041627] text-white rounded">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight leading-none">
            Turismo-llm<br/><span className="text-[#505f76] text-sm">AI</span>
          </span>
        </div>

        {/* Links de Navegação Funcionais */}
        <nav className="flex items-center gap-2 text-sm font-medium">
          <NavLink 
            to="/dashboard" 
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
            to="/pesquisa" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-md font-semibold transition-colors ${
                isActive 
                  ? 'bg-[#d2e4fb] text-[#0b1d2d]' 
                  : 'text-[#505f76] hover:text-[#041627]'
              }`
            }
          >
            Pesquisa
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

        {/* Bloco do Perfil com Dropdown */}
        <div className="flex items-center gap-3 border-l border-[#E2E8F0] pl-6 relative">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#1b1c1d]">
              {loading ? 'Carregando...' : (profile?.name || 'Novo Usuário')}
            </p>
          </div>
          
          <button 
            onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
            className="focus:outline-none hover:opacity-80 transition-opacity relative z-20"
          >
            <img 
              src={profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} 
              alt="Avatar" 
              className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]"
            />
          </button>

          {/* Menu Dropdown de Perfil */}
          {menuPerfilAberto && (
            <>
              {/* Backdrop invisível para fechar o menu ao clicar fora */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setMenuPerfilAberto(false)}
              ></div>
              
              <div className="absolute right-0 top-12 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1 z-20 text-left">
                {/* Informações visíveis apenas em telas menores (Mobile) */}
                <div className="px-4 py-2 border-b border-[#E2E8F0] sm:hidden">
                  <p className="text-sm font-semibold text-[#1b1c1d]">
                    {loading ? 'Carregando...' : (profile?.name || 'Novo Usuário')}
                  </p>
                </div>

                <button 
                  onClick={handleProfile}
                  className="w-full px-4 py-2.5 text-xs text-[#44474c] hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors"
                >
                  <User className="w-3.5 h-3.5" /> Meu Perfil
                </button>

                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-xs text-rose-700 hover:bg-rose-50 font-medium flex items-center gap-2 border-t border-[#E2E8F0] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sair da Conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}