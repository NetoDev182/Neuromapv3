import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

let _client = null;

export function getClient() {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || 
      SUPABASE_URL.includes('seu-projeto') || SUPABASE_ANON_KEY.includes('sua-chave')) {
    return null;
  }
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

export async function listarAlunos() {
  const client = getClient();
  if (!client) throw new Error('DEMO_MODE');
  const { data, error } = await client
    .from('alunos')
    .select('*')
    .order('nome', { ascending: true });
  if (error) throw error;
  return data;
}

export async function criarAluno(payload) {
  const client = getClient();
  if (!client) throw new Error('Supabase não configurado. Adicione .env.local');
  const { data, error } = await client
    .from('alunos')
    .insert([sanitize(payload)])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarAluno(id, payload) {
  const client = getClient();
  if (!client) return { ...payload, id };
  const { data, error } = await client
    .from('alunos')
    .update(sanitize(payload))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirAluno(id) {
  const client = getClient();
  if (!client) return;
  const { error } = await client
    .from('alunos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function sanitize(p) {
  return {
    nome:         String(p.nome || '').trim(),
    idade:        parseInt(p.idade) || null,
    escola:       String(p.escola || '').trim(),
    assimilacao:  parseInt(p.assimilacao) || 1,
    tratamento:   parseInt(p.tratamento)  || 1,
    conversao:    parseInt(p.conversao)   || 1,
    relacoes:     parseInt(p.relacoes)    || 1,
    mobilizacao:  parseInt(p.mobilizacao) || 1,
  };
}
