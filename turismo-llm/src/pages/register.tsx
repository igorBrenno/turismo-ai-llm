import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, BarChart2, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Register() {
  const navigate = useNavigate();

  // Estados do formulário
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Estados de requisição e feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados do validador de senha
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('Nula');
  const [strengthColor, setStrengthColor] = useState('bg-[#ba1a1a]');
  const [textColor, setTextColor] = useState('text-[#ba1a1a]');

  // Monitora a senha e calcula a segurança em tempo real
  useEffect(() => {
    let score = 0;
    if (!password) {
      setPasswordStrength(0);
      setStrengthLabel('Nula');
      setStrengthColor('bg-[#e4e2e3]');
      setTextColor('text-[#ba1a1a]');
      return;
    }

    if (password.length >= 8) score += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score += 25;
    if (password.match(/[0-9]/)) score += 25;
    if (password.match(/[^a-zA-Z0-9]/)) score += 25;

    setPasswordStrength(score);

    if (score <= 25) {
      setStrengthLabel('Fraca');
      setStrengthColor('bg-[#ba1a1a]');
      setTextColor('text-[#ba1a1a]');
    } else if (score <= 75) {
      setStrengthLabel('Média');
      setStrengthColor('bg-[#e1c29b]');
      setTextColor('text-[#584326]');
    } else {
      setStrengthLabel('Forte');
      setStrengthColor('bg-[#505f76]');
      setTextColor('text-[#505f76]');
    }
  }, [password]);

  // Envio dos dados para a Autenticação do Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. LIMITADOR PRÉVIO: Verificação manual na tabela pública por segurança adicional
      // Consultamos se já existe um usuário com o mesmo e-mail (caso salve na tabela pública)
      // ou se o e-mail gera conflito na API interna.
      const { data: existingUsers, error: searchError } = await supabase
        .from('user')
        .select('id')
        .eq('email', email.trim().toLowerCase());

      // Se a tabela pública contiver o e-mail e encontrar registro, bloqueia imediatamente sem chamar o Auth
      if (!searchError && existingUsers && existingUsers.length > 0) {
        throw new Error('Este e-mail institucional já está cadastrado em nosso sistema.');
      }

      // 2. DISPARO DO SIGNUP NO SUPABASE AUTH
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          // Enviando os metadados. O Trigger no banco usará isso para criar a linha na tabela pública
          data: {
            full_name: fullName,
            email: email.trim().toLowerCase(), // Incluído nos metadados para o trigger ler e salvar na tabela pública
            role: '', 
          }
        }
      });

      // 3. TRATAMENTO DO LIMITADOR DO SUPABASE AUTH (Garante dupla checagem caso passem da primeira barreira)
      if (error) {
        if (error.message.includes('already registered') || error.status === 422) {
          throw new Error('Este e-mail institucional já está cadastrado em nosso sistema.');
        }
        throw error;
      }

      // Se o usuário foi criado com sucesso mas o Supabase exige confirmação de e-mail por link:
      if (data.user && data.session === null) {
        setSuccessMessage('Conta pré-registrada! Verifique sua caixa de entrada para confirmar o e-mail.');
      } else {
        setSuccessMessage('Conta criada com sucesso! Redirecionando...');
      }
      
      // Limpa os campos após o sucesso
      setFullName('');
      setEmail('');
      setPassword('');

      // Aguarda 3.5 segundos para o usuário ler a mensagem de sucesso e redireciona
      setTimeout(() => {
        navigate('/');
      }, 3500);

    } catch (error: any) {
      setErrorMessage(error.message || 'Ocorreu um erro ao registrar sua conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8FAFC] font-sans selection:bg-[#d2e4fb]">
      
      {/* Wrapper Estrutural Card */}
      <main className="w-full max-w-[1100px] bg-white rounded-xl shadow-md flex flex-col md:flex-row overflow-hidden border border-[#E2E8F0] min-h-[700px]">
        
        {/* Lado Esquerdo: Identidade Visual */}
        <section className="hidden md:flex md:w-1/2 bg-[#041627] relative p-8 flex-col justify-between overflow-hidden">
          <div className="z-10">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">TouristWatch AI</h1>
            <p className="text-sm text-white/70 max-w-xs leading-relaxed">
              Plataforma de monitoramento avançado para gestão operacional e segurança em destinos turísticos.
            </p>
          </div>

          {/* Área Gráfica Ilustrativa */}
          <div className="relative flex-1 flex items-center justify-center py-8">
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            </div>
            
            {/* Widget Glassmorphism */}
            <div className="relative z-10 w-full max-w-[290px] p-5 bg-white/[0.06] backdrop-blur-md rounded-xl border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-[#d3e4fe]" />
                <span className="text-[11px] font-bold tracking-wider text-[#d3e4fe] uppercase">DENSIDADE EM TEMPO REAL</span>
              </div>
              <div className="space-y-3">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d3e4fe] w-3/4 rounded-full transition-all duration-500"></div>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#b7c8e1] w-1/2 rounded-full transition-all duration-500"></div>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d3e4fe] w-5/6 rounded-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="z-10">
            <blockquote className="text-xs italic text-white/60 border-l-2 border-[#b7c8e1] pl-4">
              "Decisões baseadas em dados para um turismo sustentável e seguro."
            </blockquote>
          </div>

          {/* Imagem de Fundo Misturada (Textura) */}
          <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
            <img 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" 
              alt="Background overlay"
            />
          </div>
        </section>

        {/* Lado Direito: Formulário de Registro */}
        <section className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            
            <div>
              <h2 className="text-2xl font-bold text-[#041627] mb-1 tracking-tight">Criar Conta</h2>
              <p className="text-sm text-[#44474c]">Registre-se para acessar o painel administrativo.</p>
            </div>

            {/* Banners de Alerta */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nome Completo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#041627] tracking-wide" htmlFor="fullName">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d] w-5 h-5 pointer-events-none" />
                  <input 
                    id="fullName"
                    type="text" 
                    required
                    disabled={isLoading}
                    placeholder="Ex: João Silva" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#fbf9fa] border border-[#c4c6cd] rounded-lg text-sm text-[#1b1c1d] focus:outline-none focus:ring-1 focus:ring-[#041627] focus:border-[#041627] transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* E-mail Institucional */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#041627] tracking-wide" htmlFor="email">E-mail Institucional</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d] w-5 h-5 pointer-events-none" />
                  <input 
                    id="email"
                    type="email" 
                    required
                    disabled={isLoading}
                    placeholder="nome@instituicao.gov.br" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#fbf9fa] border border-[#c4c6cd] rounded-lg text-sm text-[#1b1c1d] focus:outline-none focus:ring-1 focus:ring-[#041627] focus:border-[#041627] transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Senha e Medidor de Força */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#041627] tracking-wide" htmlFor="password">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d] w-5 h-5 pointer-events-none" />
                  <input 
                    id="password"
                    type={showPassword ? 'text' : 'password'} 
                    required
                    disabled={isLoading}
                    placeholder="No mínimo 8 caracteres" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-10 py-2.5 bg-[#fbf9fa] border border-[#c4c6cd] rounded-lg text-sm text-[#1b1c1d] focus:outline-none focus:ring-1 focus:ring-[#041627] focus:border-[#041627] transition-all disabled:opacity-60"
                  />
                  <button 
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777d] hover:text-[#041627] transition-colors disabled:opacity-40"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Barra Animada de Progresso de Força */}
                <div className="pt-1.5 space-y-1">
                  <div className="h-1 w-full bg-[#e4e2e3] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strengthColor} rounded-full transition-all duration-300`} 
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#44474c]">Segurança da senha</span>
                    <span className={`font-bold ${textColor}`}>{strengthLabel}</span>
                  </div>
                </div>
              </div>

              {/* Termos de Serviço */}
              <div className="flex items-start gap-3 pt-2">
                <input 
                  id="terms" 
                  type="checkbox"
                  required
                  disabled={isLoading}
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#041627] border-[#c4c6cd] rounded focus:ring-[#041627] cursor-pointer disabled:opacity-60"
                />
                <label htmlFor="terms" className="text-xs text-[#44474c] leading-normal select-none">
                  Eu concordo com os <a className="text-[#041627] font-bold hover:underline" href="#terms">Termos de Serviço</a> e as <a className="text-[#041627] font-bold hover:underline" href="#privacy">Políticas de Privacidade</a> do TouristWatch AI.
                </label>
              </div>

              {/* CTA Criar Conta */}
              <button 
                type="submit"
                disabled={isLoading || !agreeTerms}
                className="w-full bg-[#041627] text-white py-2.5 px-4 rounded-lg text-xs font-semibold hover:bg-[#112336] transition-all active:scale-[0.99] shadow-sm pt-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Criando Conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </form>

            {/* Alternar para Login */}
            <div className="text-center pt-2">
              <p className="text-sm text-[#44474c]">
                Já possui uma conta institucional?{' '}
                <a className="text-[#041627] font-bold hover:underline" href="/">
                  Fazer Login
                </a>
              </p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}