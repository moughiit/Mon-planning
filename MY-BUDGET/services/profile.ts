import { currentUserId, supabase } from './supabase';
import type { Profile, ThemePref } from '@/types/database';

export async function getProfile(): Promise<Profile> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, currency, theme')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateTheme(theme: ThemePref): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('profiles').update({ theme }).eq('id', userId);
  if (error) throw error;
}
