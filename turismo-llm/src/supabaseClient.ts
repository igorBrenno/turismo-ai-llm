// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://kcofhurjvzutcbocwtsw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjb2ZodXJqdnp1dGNib2N3dHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMDM5NTAsImV4cCI6MjA5NzU3OTk1MH0.stjRoHGSWEGwZgwDNpfY9s5etZkDsQN4NkntrJYt-PA";

// const supabaseUrl = import.meta.env.SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Variáveis de ambiente do Supabase não foram carregadas!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);