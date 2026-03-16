// src/services/auth.service.ts
import { supabase } from '../supabase';

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── Obtener perfil desde un userId ya conocido ───────────────────────────────
// Recibe el userId directamente para no hacer otra llamada a Auth
export async function getProfileByAuthId(authId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, business_id, email')
    .eq('auth_id', authId)
    .single();

  if (error) throw error;
  return data;
}