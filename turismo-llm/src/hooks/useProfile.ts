import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../types/database.types';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    try {
      setLoading(true);
      
      // 1. Busca os dados de autenticação da sessão atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('Nenhum usuário autenticado encontrado.');
        setProfile(null);
        return;
      }

      // LOG DE DIAGNÓSTICO: Abra o console do navegador (F12) e veja o que aparece aqui!
      console.log('Metadados do usuário logado:', user.user_metadata);

      // 2. Varre os metadados procurando por qualquer variação do nome cadastrado
      const nomeEncontrado = 
        user.user_metadata?.full_name || 
        user.user_metadata?.name || 
        user.user_metadata?.nome ||
        user.email?.split('@')[0]; // Se tudo falhar, usa o início do e-mail

      // 3. Tenta buscar da tabela pública 'user'
      const { data, error: dbError } = await supabase
        .from('user')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (dbError) {
        // Se a tabela estiver vazia (como vimos no painel), monta o fallback com o nome dos metadados
        setProfile({
          id: user.id,
          user_id: user.id,
          name: nomeEncontrado, 
          avatar_url: user.user_metadata?.avatar_url || null,
        } as unknown as UserProfile);
      } else {
        // Se o registro existir no banco mas a coluna 'name' estiver vazia
        if (data && !data.name) {
          data.name = nomeEncontrado;
        }
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('Erro geral no hook useProfile:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  return { profile, loading, refreshProfile: fetchProfile };
}