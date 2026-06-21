// src/hooks/useProfile.ts
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../types/database.types';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Função isolada para podermos re-executar quando o usuário atualizar o nome
  async function fetchProfile() {
    try {
      setLoading(true);
      // 1. Pega o usuário logado na sessão ativa do Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setProfile(null);
        return;
      }

      // 2. Busca os dados da tabela pública filtrando pelo ID do Auth
      const { data, error: dbError } = await supabase
        .from('user')
        .select('*')
        .eq('user_id', user.id)
        .single(); // Garante que trará apenas um objeto, não um array

      if (dbError) {
        console.error('Erro ao buscar perfil no banco:', dbError.message);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  return { profile, loading, refreshProfile: fetchProfile };
}