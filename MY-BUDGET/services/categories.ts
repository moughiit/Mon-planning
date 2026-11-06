import { supabase } from './supabase';
import type { Category, CategoryKind } from '@/types/database';

export async function listCategories(kind?: CategoryKind): Promise<Category[]> {
  let query = supabase.from('categories').select('*').order('name');
  if (kind) query = query.eq('kind', kind);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Category[];
}
