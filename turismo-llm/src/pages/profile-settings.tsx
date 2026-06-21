import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../supabaseClient';
import { useProfile } from '../hooks/useProfile';
import { 
  User, 
  Camera, 
  Lock, 
  Shield, 
  Info, 
  HelpCircle, 
  Loader2, 
  Check 
} from 'lucide-react';

export default function ProfileSettings() {
  const { profile, loading, refreshProfile } = useProfile();

  // Estados de Informações Pessoais
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('Operations Management');

  // Estados de Segurança
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de Preferências do Sistema
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [realTimeAlerts, setRealTimeAlerts] = useState(true);

  // Estados do Botão de Submit (Micro-interações de Feedback)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 1. Sincroniza os dados do perfil assim que carregarem do banco
  useEffect(() => {
    if (profile) {
      if (profile.name) setFullName(profile.name);
      // Caso sua tabela guarde outras preferências futuramente, pode alimentá-las aqui:
    }
  }, [profile]);

  // 2. Busca o e-mail real do usuário autenticado para preencher o campo desabilitado
  useEffect(() => {
    async function fetchUserEmail() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    }
    fetchUserEmail();
  }, []);

  // 3. Salva as alterações reais no banco de dados
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // Realiza o UPDATE na tabela pública 'user' usando a coluna correta 'name_user'
      const { error } = await supabase
        .from('user')
        .update({ name: fullName })
        .eq('user_id', user.id);

      if (error) throw error;

      // Ativa a animação de sucesso original da sua interface
      setIsSubmitting(false);
      setIsSaved(true);

      // Força o hook e o Header a buscarem o nome atualizado do banco
      refreshProfile();

      setTimeout(() => {
        setIsSaved(false);
      }, 2500);

    } catch (error: any) {
      setIsSubmitting(false);
      alert(`Erro ao salvar alterações: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf9fa] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#041627] animate-spin" />
        <p className="text-sm font-medium text-[#44474c]">Loading your profile settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9fa] text-[#1b1c1d] font-sans antialiased selection:bg-[#d2e4fb]">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1b1c1d] mb-1 tracking-tight">Profile Settings</h1>
          <p className="text-sm text-[#44474c]">Manage your account preferences and security credentials.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* 1. Header Section: Profile Picture */}
          <section className="bg-white p-6 rounded-xl border border-[#c4c6cd] flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full border-4 border-[#efedef] overflow-hidden bg-[#e4e2e3]">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Avatar do usuário" 
                  src={profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                />
              </div>
              <button 
                type="button" 
                className="absolute bottom-1 right-1 bg-[#041627] text-white p-2 rounded-full border-2 border-white hover:scale-105 transition-transform flex items-center justify-center"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center md:text-left space-y-1">
              <h2 className="text-xl font-bold text-[#1b1c1d]">{fullName || 'Novo Usuário'}</h2>
              <p className="text-xs text-[#44474c] uppercase tracking-wider font-semibold">Site Manager | Sector 04</p>
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-[#d0e1fb] text-[#54647a] text-[11px] font-medium rounded-lg">Verified Account</span>
                <span className="px-3 py-1 bg-[#feddb5] text-[#281802] text-[11px] font-medium rounded-lg">Admin Access</span>
              </div>
            </div>
          </section>

          {/* 2. Personal Information */}
          <section className="bg-white p-6 rounded-xl border border-[#c4c6cd] shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-[#c4c6cd] pb-3">
              <User className="w-5 h-5 text-[#041627]" />
              <h3 className="text-xs font-bold text-[#1b1c1d] uppercase tracking-widest">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#44474c]" htmlFor="fullName">Full Name</label>
                <input 
                  id="fullName"
                  className="w-full bg-[#f5f3f4] border border-[#74777d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#041627] focus:ring-1 focus:ring-[#041627] transition-all" 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#44474c]" htmlFor="email">Email Address</label>
                <div className="relative">
                  <input 
                    id="email"
                    className="w-full bg-[#e9e7e9] border border-[#c4c6cd] rounded-lg px-4 py-2.5 text-sm text-[#44474c] cursor-not-allowed select-none" 
                    disabled 
                    type="email" 
                    value={email || 'Carregando e-mail...'}
                  />
                  <Lock className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#44474c]" />
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[#44474c]" htmlFor="department">Department</label>
                <select 
                  id="department"
                  className="w-full bg-[#f5f3f4] border border-[#74777d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#041627] focus:ring-1 focus:ring-[#041627] cursor-pointer transition-all"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="Operations Management">Operations Management</option>
                  <option value="Site Surveillance">Site Surveillance</option>
                  <option value="Compliance Monitoring">Compliance Monitoring</option>
                  <option value="Administrative Portal">Administrative Portal</option>
                </select>
              </div>
            </div>
          </section>

          {/* 3. Security / Change Password */}
          <section className="bg-white p-6 rounded-xl border border-[#c4c6cd] shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-[#c4c6cd] pb-3">
              <Shield className="w-5 h-5 text-[#041627]" />
              <h3 className="text-xs font-bold text-[#1b1c1d] uppercase tracking-widest">Security & Authentication</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#44474c]" htmlFor="currentPassword">Current Password</label>
                  <input 
                    id="currentPassword"
                    className="w-full bg-[#f5f3f4] border border-[#74777d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#041627] focus:ring-1 focus:ring-[#041627] transition-all" 
                    placeholder="••••••••" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#44474c]" htmlFor="newPassword">New Password</label>
                  <input 
                    id="newPassword"
                    className="w-full bg-[#f5f3f4] border border-[#74777d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#041627] focus:ring-1 focus:ring-[#041627] transition-all" 
                    placeholder="••••••••" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#44474c]" htmlFor="confirmPassword">Confirm New Password</label>
                  <input 
                    id="confirmPassword"
                    className="w-full bg-[#f5f3f4] border border-[#74777d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#041627] focus:ring-1 focus:ring-[#041627] transition-all" 
                    placeholder="••••••••" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-[#efedef] p-4 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-[#54647a] shrink-0 mt-0.5" />
                <p className="text-xs leading-normal text-[#54647a]">
                  Password must be at least 12 characters long and include a mix of uppercase letters, numbers, and special symbols for enterprise compliance.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Preferences */}
          <section className="bg-white p-6 rounded-xl border border-[#c4c6cd] shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-[#c4c6cd] pb-3">
              <HelpCircle className="w-5 h-5 text-[#041627]" />
              <h3 className="text-xs font-bold text-[#1b1c1d] uppercase tracking-widest">System Preferences</h3>
            </div>
            <div className="space-y-6">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#1b1c1d]">Email Notifications</p>
                  <p className="text-xs text-[#44474c]">Receive daily reports and site health summaries via email.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-[#c4c6cd] rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#041627]"></div>
                </label>
              </div>
              {/* Toggle 2 */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#1b1c1d]">Real-time Compliance Alerts</p>
                  <p className="text-xs text-[#44474c]">Push notifications for urgent crowd density and safety violations.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={realTimeAlerts}
                    onChange={(e) => setRealTimeAlerts(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-[#c4c6cd] rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#041627]"></div>
                </label>
              </div>
            </div>
          </section>

          {/* 5. Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button 
              type="button" 
              className="px-6 py-3 border border-[#74777d] text-[#44474c] text-xs font-bold rounded-lg hover:bg-[#efedef] transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || isSaved}
              className={`min-w-[170px] px-6 py-3 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2 text-white
                ${isSaved ? 'bg-green-700' : 'bg-[#041627] hover:bg-[#1a2b3c]'} 
                disabled:opacity-85 disabled:pointer-events-none`}
            >
              {isSubmitting && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              )}
              {isSaved && (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved Successfully</span>
                </>
              )}
              {!isSubmitting && !isSaved && <span>Save Changes</span>}
            </button>
          </div>
        </form>

        {/* Danger Zone Footer */}
        <div className="mt-8 p-6 bg-[#ffdad6]/20 border border-[#ba1a1a]/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-[#ba1a1a]">Deactivate Account</h4>
            <p className="text-xs text-[#44474c]">Permanently remove your access to the TouristWatch AI platform.</p>
          </div>
          <button type="button" className="text-[#ba1a1a] text-xs font-bold hover:underline self-start sm:self-center">
            Request Deletion
          </button>
        </div>
      </main>

      {/* Corporate Footnote */}
      <footer className="mt-12 border-t border-[#c4c6cd] py-6 bg-[#f5f3f4]">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#44474c]">
          <p>© 2026 TouristWatch AI • Professional Compliance Systems</p>
          <div className="flex gap-6">
            <a className="hover:text-[#041627] transition-colors" href="#docs">Documentation</a>
            <a className="hover:text-[#041627] transition-colors" href="#status">System Status</a>
            <a className="hover:text-[#041627] transition-colors" href="#privacy">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}