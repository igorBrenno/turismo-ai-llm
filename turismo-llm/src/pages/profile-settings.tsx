import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useProfile } from '../hooks/useProfile';
import { 
  User, 
  Camera, 
  Lock, 
  Shield, 
  Info, 
  Loader2, 
  Check 
} from 'lucide-react';

// Importações do Firebase
import { updatePassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig';

export default function ProfileSettings() {
  const { profile, loading, refreshProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Informações Pessoais
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Estados de Segurança (Alteração de Senha)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de Carregamento específicos
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sincroniza os dados do perfil assim que carregarem do banco
  useEffect(() => {
    if (profile?.name) {
      setFullName(profile.name);
    }
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Busca o e-mail real do usuário autenticado no Firebase Auth
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.email) {
      setEmail(user.email);
    }
  }, []);

  // Resolvedor dinâmico da URL do Avatar para renderização
  const getAvatarUrl = () => {
    const rawUrl = avatarUrl || profile?.avatar_url;

    if (!rawUrl) {
      return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";
    }

    return rawUrl;
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Lógica de Upload da Foto de Perfil no Firebase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado.');

      const fileExt = file.name.split('.').pop();
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.${fileExt}`);

      // 1. Upload do arquivo para o Firebase Storage
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Atualiza o perfil nativo do Firebase Auth
      await updateProfile(user, { photoURL: downloadURL });

      // 3. Salva/Atualiza a referência da foto no documento do Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        user_id: user.uid,
        avatar_url: downloadURL,
        name: fullName || profile?.name || 'Novo Usuário',
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 4. Atualiza os estados locais
      setAvatarUrl(downloadURL);
      if (refreshProfile) await refreshProfile();
      alert('Foto de perfil atualizada com sucesso!');

    } catch (error: any) {
      alert(`Erro no upload da foto: ${error.message}`);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Salva Alterações de Texto E a Nova Senha se preenchida
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado.');

      // 1. Atualiza o displayName no Auth nativo do Firebase
      await updateProfile(user, { displayName: fullName });

      // 2. Atualiza/Cria dados no Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        user_id: user.uid,
        name: fullName,
        email: user.email,
        avatar_url: avatarUrl || profile?.avatar_url || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Se o usuário tentou mudar a senha, executa a atualização no Firebase Auth
      if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('A nova senha e a confirmação não coincidem.');
        }

        await updatePassword(user, newPassword);
        
        setNewPassword('');
        setConfirmPassword('');
        alert('Senha atualizada com sucesso!');
      }

      setIsSubmitting(false);
      setIsSaved(true);
      if (refreshProfile) await refreshProfile();

      setTimeout(() => {
        setIsSaved(false);
      }, 2500);

    } catch (error: any) {
      setIsSubmitting(false);
      if (error.code === 'auth/requires-recent-login') {
        alert('Por razões de segurança, para alterar a senha é necessário ter feito login recentemente. Refaça o login e tente novamente.');
      } else {
        alert(`Erro ao salvar alterações: ${error.message}`);
      }
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

      <main className="max-w-4xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1b1c1d] mb-1 tracking-tight">Profile Settings</h1>
          <p className="text-sm text-[#44474c]">Manage your account preferences and security credentials.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* 1. Imagem de Perfil */}
          <section className="bg-white p-6 rounded-xl border border-[#c4c6cd] flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              <div className="w-32 h-32 rounded-full border-4 border-[#efedef] overflow-hidden bg-[#e4e2e3] relative flex items-center justify-center">
                {isUploadingPhoto ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center z-10">
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                <img 
                  className="w-full h-full object-cover" 
                  alt="Avatar do usuário" 
                  src={getAvatarUrl()}
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
              <h2 className="text-xl font-bold text-[#1b1c1d]">{fullName || profile?.name || 'Novo Usuário'}</h2>
              <p className="text-xs text-[#44474c]">Clique na imagem para alterar sua foto de perfil.</p>
            </div>
          </section>

          {/* 2. Informações Pessoais */}
          <section className="bg-white p-6 rounded-xl border border-[#c4c6cd] shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-[#c4c6cd] pb-3">
              <User className="w-5 h-5 text-[#041627]" />
              <h3 className="text-xs font-bold text-[#1b1c1d] uppercase tracking-widest">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
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
              <div className="space-y-1.5 md:col-span-2">
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
            </div>
          </section>

          {/* 3. Segurança (Nova Senha) */}
          <section className="bg-white p-6 rounded-xl border border-[#c4c6cd] shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-[#c4c6cd] pb-3">
              <Shield className="w-5 h-5 text-[#041627]" />
              <h3 className="text-xs font-bold text-[#1b1c1d] uppercase tracking-widest">Security & Authentication</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#44474c]" htmlFor="newPassword">New Password</label>
                  <input 
                    id="newPassword"
                    className="w-full bg-[#f5f3f4] border border-[#74777d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#041627] focus:ring-1 focus:ring-[#041627] transition-all" 
                    placeholder="Deixe em branco para não alterar" 
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
                    placeholder="Confirme sua nova senha" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-[#efedef] p-4 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-[#54647a] shrink-0 mt-0.5" />
                <p className="text-xs leading-normal text-[#54647a]">
                  Preencha os campos acima caso deseje atualizar sua credencial de acesso ao sistema.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Ações */}
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
      </main>

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