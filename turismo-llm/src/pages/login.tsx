import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Monitor, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
// Importações de autenticação do Firebase
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Importa a instância do auth configurada

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(''); // Reseta erros anteriores

    try {
      // Configura a persistência baseada no checkbox "Lembrar-me"
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      // Executa a autenticação no Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      console.log('Login efetuado com sucesso no Firebase:', userCredential.user);
      
      // Redireciona para a Dashboard após o login bem-sucedido
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      
      // Tratamento amigável para mensagens de erro comuns do Firebase
      let message = 'Erro ao autenticar. Verifique suas credenciais.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas malsucedidas. Tente novamente mais tarde.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'O formato do e-mail inserido é inválido.';
      }

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-[#1b1c1d] bg-[#fbf9fa] font-sans selection:bg-[#d2e4fb] selection:text-[#0b1d2d] relative">
      <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
        
        {/* Seção Visual Esquerda (Oculta no Mobile) */}
        <section className="hidden lg:flex relative flex-col justify-end p-8 overflow-hidden bg-[#041627]">
          <img 
            alt="Paisagem montanhosa vibrante com nuvens" 
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80" 
            className="absolute inset-0 w-full h-full object-cover opacity-60" 
          />
          
          <div className="relative z-10 space-y-4 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d2e4fb] text-[#0b1d2d] rounded-full text-xs font-semibold tracking-wider">
              <Shield className="w-4 h-4" />
              <span>SISTEMA SEGURO</span>
            </div>
            
            <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
              Observação Global, Gestão Local.
            </h1>
            
            <p className="text-base text-white/80 leading-relaxed">
              Acompanhe em tempo real o fluxo turístico e garanta a integridade das operações nos locais mais visitados do mundo.
            </p>
          </div>

          {/* Efeito sutil de Grid Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10" 
            style={{ 
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }}
          />
        </section>

        {/* Seção do Formulário de Login */}
        <section className="flex items-center justify-center p-6 md:p-8 bg-[#fbf9fa]">
          <div className="w-full max-w-[440px] space-y-8">
            
            {/* Branding e Título */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#041627] flex items-center justify-center rounded-lg shadow-sm">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-[#041627]">TouristWatch AI</span>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-[#1b1c1d]">Bem-vindo de volta</h2>
                <p className="text-sm text-[#44474c]">
                  Insira suas credenciais corporativas para acessar o console.
                </p>
              </div>
            </div>

            {/* Caixa de Mensagem de Erro (Se houver) */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                
                {/* Input de Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#44474c] tracking-wider block" htmlFor="email">
                    E-MAIL
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#74777d] pointer-events-none">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input 
                      id="email"
                      type="email" 
                      required
                      placeholder="exemplo@gmail.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-[#c4c6cd] rounded-lg text-sm text-[#1b1c1d] focus:outline-none focus:ring-2 focus:ring-[#041627] focus:border-[#041627] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Input de Senha */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#44474c] tracking-wider block" htmlFor="password">
                      SENHA
                    </label>
                    <a href="#forgot" className="text-xs font-semibold text-[#041627] hover:underline transition-all">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#74777d] pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input 
                      id="password"
                      type="password" 
                      required
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-[#c4c6cd] rounded-lg text-sm text-[#1b1c1d] focus:outline-none focus:ring-2 focus:ring-[#041627] focus:border-[#041627] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox "Lembrar-me" */}
              <div className="flex items-center gap-3">
                <input 
                  id="remember" 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-[#041627] border-[#c4c6cd] rounded focus:ring-[#041627] cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-[#44474c] cursor-pointer select-none">
                  Lembrar-me por 30 dias
                </label>
              </div>

              {/* Botão de Submit (CTA) */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#041627] text-white font-semibold rounded-lg hover:bg-[#112336] transition-all active:scale-[0.99] flex justify-center items-center gap-2 disabled:opacity-75 disabled:pointer-events-none shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Carregando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Redirecionamento para Registro */}
            <div className="text-center pt-2">
              <p className="text-sm text-[#44474c]">
                Não possui uma conta?{' '}
                <button
                  onClick={() => navigate('/register')}
                  disabled={isLoading}
                  className="text-[#041627] font-bold hover:underline transition-all focus:outline-none disabled:opacity-60"
                >
                  Criar Conta
                </button>
              </p>
            </div>

            {/* Rodapé da Caixa de Login */}
            <div className="pt-6 border-t border-[#c4c6cd] flex flex-col sm:flex-row justify-between gap-3 text-[#44474c] text-xs font-medium">
              <p>© 2026 TouristWatch AI. Todos os direitos reservados.</p>
              <div className="flex gap-4">
                <a href="#terms" className="hover:text-[#041627] transition-colors">Termos</a>
                <a href="#privacy" className="hover:text-[#041627] transition-colors">Privacidade</a>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Efeito Atmosférico de Fundo */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(4,22,39,0.02)_0%,transparent_50%)]" />
    </div>
  );
}